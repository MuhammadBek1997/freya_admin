import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { getAuthToken } from '../Context';
import { clickPayForPostRedirectUrl } from '../apiUrls';
import { UseGlobalContext } from '../Context';

const EmployeePostForm = ({ employeeId, onClose, onPostAdded }) => {
    const { t, uploadPhotosToServer, user } = UseGlobalContext();
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [postLimits, setPostLimits] = useState(null);
    const [showPayment, setShowPayment] = useState(false);

    // Media files uchun state
    const [mediaFiles, setMediaFiles] = useState([]);
    const [pendingMedia, setPendingMedia] = useState([]);
    const fileInputRef = useRef(null);
    // Payment form state
    const [cardNumberState, setCardNumberState] = useState('');
    const [cardDateState, setCardDateState] = useState('');
    const [cardNameState, setCardNameState] = useState('');
    const [phoneState, setPhoneState] = useState('+998');

    useEffect(() => {
        fetchPostLimits();
    }, [employeeId]);

    const fetchPostLimits = async () => {
        try {
            const response = await axios.get(`/api/payments/employee/limits`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {})
                }
            });
            setPostLimits(response.data.data);
        } catch (error) {
            console.error('Post limitlarini olishda xatolik:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Media fayllarni tanlash
    const handleMediaSelect = (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        const maxBytes = 4 * 1024 * 1024;
        const validFiles = files.filter(f => {
            const isImage = f.type?.startsWith('image/');
            const isVideo = f.type?.startsWith('video/');
            const isValidSize = f.size <= maxBytes;
            
            if (!isImage && !isVideo) {
                alert(`${f.name} rasm yoki video emas`);
                return false;
            }
            if (!isValidSize) {
                alert(`${f.name} hajmi katta (maks 4MB)`);
                return false;
            }
            return true;
        });

        const newMediaPreviews = validFiles.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            type: file.type.startsWith('image/') ? 'image' : 'video'
        }));

        setPendingMedia(prev => [...prev, ...newMediaPreviews]);
        
        try {
            event.target.value = '';
        } catch {}
    };

    // Media faylni o'chirish
    const handleDeleteMedia = (index) => {
        setPendingMedia(prev => {
            const newMedia = [...prev];
            if (newMedia[index]?.preview) {
                URL.revokeObjectURL(newMedia[index].preview);
            }
            newMedia.splice(index, 1);
            return newMedia;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.title.trim() || !formData.description.trim()) {
            setError(t('fillAllFields') || 'Barcha maydonlarni to\'ldiring');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // 1. Avval media fayllarni yuklash
            let mediaUrls = [];
            if (pendingMedia.length > 0) {
                console.log('📤 Uploading', pendingMedia.length, 'media files...');
                const files = pendingMedia.map(m => m.file);
                mediaUrls = await uploadPhotosToServer(files);
                console.log('✅ Media uploaded:', mediaUrls);
            }

            // 2. Post yaratish
            const postPayload = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                media_files: mediaUrls
            };

            console.log('📤 Creating post:', postPayload);

            const response = await axios.post(
                `/api/employees/${employeeId}/posts`,
                postPayload,
                { 
                    headers: {
                        'Content-Type': 'application/json',
                        ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {})
                    }
                }
            );

            if (response.data.success) {
                console.log('✅ Post created successfully');
                
                // Preview URLlarni tozalash
                pendingMedia.forEach(m => {
                    if (m.preview) URL.revokeObjectURL(m.preview);
                });

                onPostAdded(response.data.data);
                setFormData({ title: '', description: '' });
                setPendingMedia([]);
                fetchPostLimits();
            }
        } catch (error) {
            console.error('❌ Post yaratishda xatolik:', error);
            
            if (error.response?.status === 403) {
                setShowPayment(true);
            } else {
                setError(
                    error.response?.data?.message || 
                    error.message || 
                    t('postAddError') || 
                    'Post qo\'shishda xatolik yuz berdi'
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBuyPosts = async (postCount = 4) => {
        try {
            const response = await axios.post(
                clickPayForPostRedirectUrl,
                null,
                {
                    params: {
                        post_quantity: postCount,
                        card_type: 'humo',
                        return_url: window.location.origin
                    },
                    headers: {
                        ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {})
                    }
                }
            );

            if (response?.data?.success && response?.data?.redirect_url) {
                window.open(response.data.redirect_url, '_blank');
            } else {
                const msg = response?.data?.error || t('paymentError') || "To'lov yaratishda xatolik";
                setError(msg);
            }
        } catch (error) {
            setError(error.response?.data?.error || error.response?.data?.message || t('paymentError') || "To'lov yaratishda xatolik");
        }
    };

    if (showPayment) {
    // Payment overlay for buying 4 posts (redirect to Click)
        return (
            <div style={{
                backgroundColor: '#f3f6f8',
                borderRadius: '10px',
                width: '100%',
                padding:"1.5rem"
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img src="/images/paymentIcon.png" alt="" />
                        <div>
                            <div style={{ fontWeight: 700, color: '#222' }}>Провести оплату</div>
                            <div style={{ fontSize: 12, color: '#6b7280' }}>Чтобы опубликовать ещё, проведите оплату и вам будет открыто доступ ещё к 4 постам.</div>
                        </div>
                    </div>
                    <button onClick={() => setShowPayment(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
                </div>
                <button
                    onClick={async () => {
                        await handleBuyPosts(4);
                    }}
                    style={{ marginTop: '1rem', width: '100%', padding: '0.9rem', background: '#2dd4bf', color: '#fff', border: 'none', borderRadius: 8, fontSize: '1rem', fontWeight: 600 }}
                >Оплатить через Click</button>
            </div>
        );
    }

    return (
        <div style={{
            padding: '2rem',
            backgroundColor: 'white',
            borderRadius: '12px',
            maxHeight: '90vh',
            overflowY: 'auto'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                paddingBottom: '1rem',
                borderBottom: '2px solid #f3f4f6'
            }}>
                <h3 style={{ 
                    fontSize: '1.5rem',
                    color: '#1f2937',
                    fontWeight: '600'
                }}>
                    {t('addNewPost') || 'Yangi post qo\'shish'}
                </h3>
                <button 
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '2rem',
                        cursor: 'pointer',
                        color: '#6b7280',
                        lineHeight: '1',
                        padding: '0',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#f3f4f6';
                        e.target.style.color = '#1f2937';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = '#6b7280';
                    }}
                >
                    ×
                </button>
            </div>

            {/* Post Limits Info */}
            {postLimits && (
                <div style={{
                    padding: '1rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    justifyContent: 'space-around'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                            {t('freePosts') || 'Tekin postlar'}
                        </p>
                        <p style={{ 
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: '#10b981'
                        }}>
                            {postLimits.remaining_free_posts}
                        </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                            {t('paidPosts') || 'To\'lovli postlar'}
                        </p>
                        <p style={{ 
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: '#9C2BFF'
                        }}>
                            {postLimits.remaining_paid_posts}
                        </p>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div style={{
                    padding: '1rem',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    color: '#dc2626',
                    marginBottom: '1.5rem'
                }}>
                    {error}
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
                {/* Title */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.5rem'
                    }}>
                        {t('postTitle') || 'Sarlavha'} <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        placeholder={t('enterPostTitle') || 'Post sarlavhasini kiriting'}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            outline: 'none',
                            transition: 'border-color 0.3s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#9C2BFF'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                </div>

                {/* Description */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.5rem'
                    }}>
                        {t('description') || 'Tavsif'} <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        placeholder={t('enterDescription') || 'Post tavsifini kiriting'}
                        rows="4"
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            outline: 'none',
                            transition: 'border-color 0.3s',
                            resize: 'vertical',
                            fontFamily: 'inherit'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#9C2BFF'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                </div>

                {/* Media Upload */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.5rem'
                    }}>
                        {t('mediaFiles') || 'Media fayllar'} ({t('optional') || 'ixtiyoriy'})
                    </label>
                    
                    {/* Media Preview Grid */}
                    {pendingMedia.length > 0 && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                            gap: '1rem',
                            marginBottom: '1rem'
                        }}>
                            {pendingMedia.map((media, index) => (
                                <div key={index} style={{
                                    position: 'relative',
                                    paddingTop: '100%',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    border: '2px solid #e5e7eb'
                                }}>
                                    {media.type === 'image' ? (
                                        <img
                                            src={media.preview}
                                            alt={`Preview ${index + 1}`}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    ) : (
                                        <video
                                            src={media.preview}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteMedia(index)}
                                        style={{
                                            position: 'absolute',
                                            top: '4px',
                                            right: '4px',
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            border: 'none',
                                            backgroundColor: '#ef4444',
                                            color: 'white',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1rem',
                                            fontWeight: 'bold',
                                            transition: 'background-color 0.3s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Upload Button */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            border: '2px dashed #d1d5db',
                            borderRadius: '8px',
                            backgroundColor: '#f9fafb',
                            color: '#6b7280',
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            fontSize: '0.875rem'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.borderColor = '#9C2BFF';
                            e.target.style.backgroundColor = '#f3e8ff';
                            e.target.style.color = '#9C2BFF';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.borderColor = '#d1d5db';
                            e.target.style.backgroundColor = '#f9fafb';
                            e.target.style.color = '#6b7280';
                        }}
                    >
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
                        </svg>
                        {t('uploadMedia') || 'Rasm yoki video yuklash'}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleMediaSelect}
                        style={{ display: 'none' }}
                    />
                </div>

                {/* Action Buttons */}
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginTop: '2rem'
                }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            backgroundColor: '#f3f4f6',
                            color: '#374151',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                    >
                        {t('cancel') || 'Bekor qilish'}
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            backgroundColor: loading ? '#d1d5db' : '#9C2BFF',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: '500',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'background-color 0.3s'
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) e.target.style.backgroundColor = '#7c22cc';
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) e.target.style.backgroundColor = '#9C2BFF';
                        }}
                    >
                        {loading ? (t('adding') || 'Qo\'shilmoqda...') : (t('addPost') || 'Post qo\'shish')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EmployeePostForm;