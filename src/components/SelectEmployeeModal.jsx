import React from 'react'
import { UseGlobalContext } from '../Context'

const SelectEmployeeModal = ({ setSelectEmploy }) => {
  const { mastersArr } = UseGlobalContext()



  return (
    <div className='select-employModal'>
      <div className='select-employModal-cont'>
        <div className='select-employModal-top'>
          <button onClick={() => setSelectEmploy(false)}>
            <img src="/images/arrowLeft.png" alt="" />
          </button>
          <h3>
            Выберите обслуживающего
          </h3>
        </div>
        <div className='select-employModal-body'>
          {
            mastersArr.map((item) => {
              return (
                <div className='select-employModal-body-item' key={item.id}>
                  <div className='select-employModal-body-item-top'>
                    <img src="/images/masterImage.png" alt="" />
                    <div>
                      <h4>
                        {item.name}
                      </h4>
                      <p>
                        работы
                      </p>
                      <div className='select-employModal-body-item-rating'>
                        <img src="/images/Star1.png" alt="" />
                        <p>
                          4.8 (13 отзывов)
                        </p>
                      </div>
                    </div>
                  </div>
                  <button id='select-employModal-body-item-btn'>
                    Выбрать
                  </button>
                </div>
              )
            })
          }
        </div>
      </div>
    </div>
  )
}

export default SelectEmployeeModal