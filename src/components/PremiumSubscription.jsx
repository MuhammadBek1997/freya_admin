import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuthToken } from '../Context';
import { paymentUserPremiumUrl } from '../apiUrls';
import './PremiumSubscription.css';

const PremiumSubscription = ({ onClose }) => {
    const [subscriptionStatus, setSubscriptionStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSubscriptionStatus();
    }, []);

    const fetchSubscriptionStatus = async () => {
        try {
            // Agar backendda alohida subscription status endpoint bo'lmasa,
            // premium obuna holatini yaratish/payments oqimidan so‘ng yangilanadi.
            // Bu yerda backendga tegmasdan barqaror GET chaqiruvini o‘tkazib qo‘yamiz.
            setSubscriptionStatus(null);
        } catch (error) {
        }
    };

    const handleSubscribe = async (duration) => {
        setLoading(true);
        setError('');

        try {
            const response = await axios.post(
                paymentUserPremiumUrl,
                { duration },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {})
                    }
                }
            );

            if (response.data.success) {
                // To'lov URL ga yo'naltirish
                window.open(response.data.data.paymentUrl, '_blank');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'To\'lov yaratishda xatolik');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('uz-UZ');
    };

    return (
        <div className="premium-subscription">
            <div className="premium-modal">
                <div className="premium-header">
                    <h2>Premium Obuna</h2>
                    <button onClick={onClose} className="close-btn">×</button>
                </div>

                {subscriptionStatus && subscriptionStatus.is_premium && (
                    <div className="current-subscription">
                        <div className="premium-badge">
                            <span>🌟 Premium Foydalanuvchi</span>
                        </div>
                        <p>Obuna tugash sanasi: {formatDate(subscriptionStatus.premium_until)}</p>
                    </div>
                )}

                {error && <div className="error-message">{error}</div>}

                <div className="premium-benefits">
                    <h3>Premium Imtiyozlar</h3>
                    <ul>
                        <li>✅ Cheksiz salon qidirish</li>
                        <li>✅ Premium salonlarga kirish</li>
                        <li>✅ Maxsus chegirmalar</li>
                        <li>✅ Birinchi navbatda qo'llab-quvvatlash</li>
                        <li>✅ Reklama yo'q</li>
                        <li>✅ Maxsus badge va status</li>
                    </ul>
                </div>

                <div className="subscription-plans">
                    <h3>Obuna Rejalari</h3>
                    
                    <div className="plans-grid">
                        <div className="plan-card">
                            <div className="plan-header">
                                <h4>1 Oylik</h4>
                                <div className="plan-price">
                                    <span className="price">50,000</span>
                                    <span className="currency">so'm</span>
                                </div>
                            </div>
                            <div className="plan-features">
                                <p>Barcha premium imtiyozlar</p>
                                <p>30 kun davomida</p>
                            </div>
                            <button 
                                onClick={() => handleSubscribe(1)} 
                                disabled={loading}
                                className="subscribe-btn"
                            >
                                {loading ? 'Yuklanmoqda...' : 'Obuna bo\'lish'}
                            </button>
                        </div>

                        <div className="plan-card popular">
                            <div className="popular-badge">Mashhur</div>
                            <div className="plan-header">
                                <h4>3 Oylik</h4>
                                <div className="plan-price">
                                    <span className="price">120,000</span>
                                    <span className="currency">so'm</span>
                                </div>
                                <div className="plan-discount">20% chegirma</div>
                            </div>
                            <div className="plan-features">
                                <p>Barcha premium imtiyozlar</p>
                                <p>90 kun davomida</p>
                                <p>Eng tejamkor variant</p>
                            </div>
                            <button 
                                onClick={() => handleSubscribe(3)} 
                                disabled={loading}
                                className="subscribe-btn premium"
                            >
                                {loading ? 'Yuklanmoqda...' : 'Obuna bo\'lish'}
                            </button>
                        </div>

                        <div className="plan-card">
                            <div className="plan-header">
                                <h4>6 Oylik</h4>
                                <div className="plan-price">
                                    <span className="price">200,000</span>
                                    <span className="currency">so'm</span>
                                </div>
                                <div className="plan-discount">33% chegirma</div>
                            </div>
                            <div className="plan-features">
                                <p>Barcha premium imtiyozlar</p>
                                <p>180 kun davomida</p>
                                <p>Maksimal tejash</p>
                            </div>
                            <button 
                                onClick={() => handleSubscribe(6)} 
                                disabled={loading}
                                className="subscribe-btn"
                            >
                                {loading ? 'Yuklanmoqda...' : 'Obuna bo\'lish'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="premium-footer">
                    <p>
                        <small>
                            To'lov Click orqali amalga oshiriladi. Obuna avtomatik yangilanmaydi.
                        </small>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PremiumSubscription;