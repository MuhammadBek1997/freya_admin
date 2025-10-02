import React from 'react'
import { useI18n } from '../hooks/useI18n'

const BookScheduleModal = ({ schedule_name, title, date, setEditModal }) => {
  const { t } = useI18n();
  return (
    <div className='editSchedule-modal'>
            <div className="editSchedule-modal-cont">
                <h2>{t('modalEdit')}</h2>
                <div className='schedule-modal-form'>
                    <label htmlFor="">
                        {t('modalLesson')}
                    </label>
                    <input type="text" placeholder={t('modalLessonPlh')} className="form-inputs" defaultValue={schedule_name} />
                    <label htmlFor="">
                        {t('modalTitle')}
                    </label>
                    <input type="text" placeholder={t('modalTitlePlh')} className="form-inputs" defaultValue={title} />
                    <label htmlFor="">
                        {t('modalDate')}
                    </label>
                    <input type="date" className="form-inputs" defaultValue={date} />
                    
                    <div className=''>

                    </div>
                </div>
                <div className='schedule-modal-btns'>
                    <button onClick={()=>setEditModal && setEditModal(false)}>
                        {t('cancel')}
                    </button>
                    <button>
                        {t('save')}
                    </button>
                </div>
            </div>
        </div>
  )
}

export default BookScheduleModal