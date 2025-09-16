
import { useState } from "react"
import { UseGlobalContext } from "../Context"
import SelectEmployeeModal from "./SelectEmployeeModal"



const AddScheduleModal = () => {
    
    const {
        setAddSched
    } = UseGlobalContext()

    const [selectEmploy,setSelectEmploy] = useState(false)

    return (
        <div className='schedule-modal'>
            <div className='schedule-modal-cont'>
                <h4>
                    Добавить
                </h4>
                <div className='schedule-modal-form'>
                    <label htmlFor="">
                        Занятие
                    </label>
                    <input type="text" placeholder='Занятие 1' className="form-inputs" />
                    <label htmlFor="">
                        Титул
                    </label>
                    <input type="text" placeholder='Титул 1'  className="form-inputs" />
                    <label htmlFor="">
                        Дата
                    </label>
                    <input type="date"  className="form-inputs" />
                    
                </div>
                <div className='schedule-modal-addPersonal'>
                    <label htmlFor="">
                        Обслуживающие
                    </label>
                    <button onClick={()=>setSelectEmploy(true)}>
                        <img src="/images/+.png" alt="" />
                        добавить
                    </button>
                    {
                        selectEmploy
                        ?
                        <SelectEmployeeModal setSelectEmploy={setSelectEmploy}/>
                        :
                        null
                    }
                    <label htmlFor="">
                        Цена услуги
                    </label>
                    <input type="text" placeholder='0 UZS' />
                </div>
                <div className='schedule-modal-paymentType'>
                    <label htmlFor="">
                        Оплата через приложение (необязательно)
                    </label>
                    <div className='schedule-modal-paymentType-cont'>
                        <button>
                            Полная оплата
                        </button>
                        <button>
                            Начальный взнос
                        </button>
                        <input type="text" placeholder='0 UZS' />
                    </div>
                </div>
                <div className='schedule-modal-btns'>
                    <button onClick={() => setAddSched(false)}>
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

export default AddScheduleModal