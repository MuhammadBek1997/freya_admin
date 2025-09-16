import React from 'react'
import { UseGlobalContext } from '../Context'

const ConfirmModal = () => {
    const {t, selectedElement , confirmModal , setConfirmModal , handleConfirm} = UseGlobalContext()

   

  return (
        <div className="confirm-cont">
            <div className="confirm-text-cont">
                <h3>
                    Подтвердите действие:
                </h3>
            </div>
            <div>
                <div className="confirm-btns">
                    <button onClick={()=>setConfirmModal(true)}>
                        Нет
                    </button>
                    <button onClick={()=>handleConfirm(selectedElement)}>
                        Да
                    </button>
                </div>
            </div>
        </div>
  )
}

export default ConfirmModal