import React from 'react'
import { UseGlobalContext } from '../Context'

const ConfirmModal = () => {
    const {t, setConfirmModal, handleConfirm} = UseGlobalContext()

    return (
        <div className="confirm-cont">
            <div className="confirm-text-cont">
                <h3>
                    {t('confirmAction') || 'Подтвердите действие:'}
                </h3>
            </div>
            <div>
                <div className="confirm-btns">
                    <button onClick={() => setConfirmModal(false)}>
                        {t('no') || 'Нет'}
                    </button>
                    <button onClick={handleConfirm}>
                        {t('yes') || 'Да'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ConfirmModal