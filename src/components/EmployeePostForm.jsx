import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EmployeePostForm = ({ employeeId, onClose, onPostAdded }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        media: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [postLimits, setPostLimits] = useState(null);
    const [showPayment, setShowPayment] = useState(false);

    // Post limitlarini olish
    useEffect(() => {
        fetchPostLimits();
    }, [employeeId]);

    const fetchPostLimits = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(`/api/payments/employee/limits`, {
                headers: { Authorization: `Bearer ${token}` }
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.post(`/api/employees/${employeeId}/posts`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                onPostAdded(response.data.data);
                setFormData({ title: '', description: '', media: '' });
                fetchPostLimits(); // Limitlarni yangilash
            }
        } catch (error) {
            if (error.response?.status === 403) {
                setShowPayment(true);
            } else {
                setError(error.response?.data?.message || 'Post qo\'shishda xatolik yuz berdi');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBuyPosts = async (postCount = 4) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.post('/api/payments/employee/posts', 
                { postCount }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                // To'lov URL ga yo'naltirish
                window.open(response.data.data.paymentUrl, '_blank');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'To\'lov yaratishda xatolik');
        }
    };

    if (showPayment) {
        return (
            <div className="employee-post-payment">
                <div className="payment-modal">
                    <h3>Post limitingiz tugadi!</h3>
                    <p>Yangi postlar qo'shish uchun to'lov qiling</p>
                    
                    <div className="payment-options">
                        <div className="payment-option">
                            <h4>4 ta post</h4>
                            <p>20,000 so'm</p>
                            <button onClick={() => handleBuyPosts(4)}>
                                Sotib olish
                            </button>
                        </div>
                        <div className="payment-option">
                            <h4>8 ta post</h4>
                            <p>40,000 so'm</p>
                            <button onClick={() => handleBuyPosts(8)}>
                                Sotib olish
                            </button>
                        </div>
                        <div className="payment-option">
                            <h4>12 ta post</h4>
                            <p>60,000 so'm</p>
                            <button onClick={() => handleBuyPosts(12)}>
                                Sotib olish
                            </button>
                        </div>
                    </div>
                    
                    <button onClick={() => setShowPayment(false)} className="cancel-btn">
                        Bekor qilish
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="employee-post-form">
            <div className="form-header">
                <h3>Yangi post qo'shish</h3>
                <button onClick={onClose} className="close-btn">×</button>
            </div>

            {postLimits && (
                <div className="post-limits-info">
                    <p>Tekin postlar: {postLimits.remaining_free_posts}</p>
                    <p>To'lovli postlar: {postLimits.remaining_paid_posts}</p>
                </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="title">Sarlavha</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        placeholder="Post sarlavhasini kiriting"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="description">Tavsif</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        placeholder="Post tavsifini kiriting"
                        rows="4"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="media">Media URL (ixtiyoriy)</label>
                    <input
                        type="url"
                        id="media"
                        name="media"
                        value={formData.media}
                        onChange={handleInputChange}
                        placeholder="Rasm yoki video URL"
                    />
                </div>

                <div className="form-actions">
                    <button type="button" onClick={onClose} className="cancel-btn">
                        Bekor qilish
                    </button>
                    <button type="submit" disabled={loading} className="submit-btn">
                        {loading ? 'Qo\'shilmoqda...' : 'Post qo\'shish'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EmployeePostForm;