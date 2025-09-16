
const EditScheduleModal = ({
    date,
    dayOfWeek,
    deposit,
    end_time,
    id,
    master,
    price,
    schedule_name,
    start_time,
    title,
    setEditModal
}) => {


    return (
        <div className='editSchedule-modal'>
            <div className="editSchedule-modal-cont">
                <h2>Редактировать</h2>
                <div className='schedule-modal-form'>
                    <label htmlFor="">
                        Занятие
                    </label>
                    <input type="text" placeholder='Занятие 1' className="form-inputs" value={schedule_name} />
                    <label htmlFor="">
                        Титул
                    </label>
                    <input type="text" placeholder='Титул 1' className="form-inputs" value={title} />
                    <label htmlFor="">
                        Дата
                    </label>
                    <input type="date" className="form-inputs" value={date} />
                    
                </div>
                <div className='schedule-modal-btns'>
                    <button onClick={()=>setEditModal(false)}>
                        Отменить
                    </button>
                    <button>
                        Сохранить
                    </button>
                </div>
            </div>
        </div>
    )
}

export default EditScheduleModal