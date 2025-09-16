import React from 'react'
import { UseGlobalContext } from '../Context'
import YandexMap from '../components/YandexMap'
import ReadMoreReact from 'read-more-react';


const Profile = () => {

  const { t, language, handleChange, companyData, commentsArr } = UseGlobalContext()


  const formatSumm = (num) => {
    let init = 5
    if (num >= 10000000000) {
      init = 9
    }
    else if (num >= 1000000000) {
      init = 7
    } else if (num >= 100000000) {
      init = 5
    } else if (num >= 10000000) {
      init = 3
    }
    else if (num >= 1000000) {
      init = 1
    }
    return num
      .toString()
      .split('')
      .reverse()
      .reduce((acc, digit, i) => (i > 0 && (num.toString().length - (i - init)) % 3 === 0 ? ` ${digit}${acc}` : `${digit}${acc}`), '');
  }
  let salonComments = commentsArr.filter(item => item.salon == companyData[0].id)

  return (
    <section>
      <nav className='profile-nav'>
        <div className='profile-nav-top'>
          <div className='profile-nav-logo'>
            <img src="/images/profileIcon.png" alt="" />
            <h2>
              Профиль заведение
            </h2>
          </div>
          <div className='profile-nav-lang'>
            <img src="/images/globusGray.png" alt="" className='globus' />
            <select value={language} onChange={handleChange}>
              <option value="ru">RU</option>
              <option value="uz">UZ</option>
              <option value="en">EN</option>
            </select>
            <img src="/images/Arrow.png" alt="Arrow" className='arrow' />
          </div>
        </div>
        <div className='profile-nav-bottom'>
          <div className="profile-nav-left">
            <div className='company-image' style={{
              background: companyData[0].icon ? `url(${companyData[0].icon})` : "/images/ForCompanyImage.png",
              backgroundSize: companyData[0].icon ? "cover" : "30%",
              backgroundPosition: "center center"
            }}>

            </div>
            <div className='profile-nav-info'>
              <div className='profile-salon-name'>
                <h2>
                  {companyData[0].name}
                </h2>
                <button>
                  <img src="/images/editPen.png" alt="" />
                  Редактировать
                </button>
              </div>
              <div className='profile-salon-rating'>
                <div
                  className="stars"
                  style={{ '--rating': companyData[0].rating }}
                  aria-label={`Rating: ${companyData[0].rating} out of 5 stars`}
                >
                </div>
                <p>
                  {companyData[0].rating} ({salonComments.length} отзывов )
                </p>
              </div>
              <div className='profile-salon-sale'>

              </div>
            </div>
          </div>
          <div className="profile-nav-right">
            <div className='profile-nav-clientsAmount'>
              <div>
                <img src="/images/profileAv.png" alt="" />
                <p>
                  Клиентов за месяц
                </p>
              </div>
              <h4>
                <span>
                  1,7
                </span> тыс
              </h4>
              <img src="/images/clientGraph.png" alt="" />
            </div>
            <div className='profile-nav-workTime'>
              <div>
                <img src="/images/workTimeIcon.png" alt="" />
                <h3>
                  8:00 - 22:00
                </h3>
              </div>
              <div>
                <img src="/images/workDateIcon.png" alt="" />
                <h3>
                  Понедельник - Суббота
                </h3>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <div className='profile-body'>
        <div className="profile-body-left">
          <div className="company-data">
            <div className='company-images'>
              {companyData[0].company_images.length > 0
                ?
                <div id="indicators-carousel" className="relative w-full" data-carousel="slide" data-carousel-interval="15000">
                  {/* <!-- Carousel wrapper --> */}
                  <div className="relative overflow-hidden md:h-96" style={{ height: "50vh", borderRadius: "1vw" }}>
                    {companyData[0].company_images.map((item, index) => {
                      return (<div
                        key={index}
                        className="hidden duration-700 ease-in-out"
                        data-carousel-item
                      >
                        <img
                          src={item}
                          className="absolute block"
                          alt="..."
                          style={{ borderRadius: "1vw" }}
                          id='carousel-img'
                        />
                      </div>)
                    })}
                  </div>
                  {/* <!-- Slider indicators --> */}
                  <div
                    style={{ bottom: "1vw" }}
                    className="absolute z-30 flex gap-x-px -translate-x-1/2 left-1/2 space-x-3 rtl:space-x-reverse">
                    {companyData[0].company_images.map((_, index) => {
                      return (
                        <button
                          key={index}
                          type="button"
                          className="rounded-full"
                          aria-current={index === 0 ? "true" : "false"}
                          aria-label={`Slide ${index + 1}`}
                          data-carousel-slide-to={index}
                        ></button>
                      );
                    })}
                  </div>
                  {/* <!-- Slider controls --> */}
                  <button
                    type="button"
                    className="absolute top-0 end-0 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none"
                    data-carousel-next
                    style={{ width: "4vw" }}
                  >
                    <span
                      className="inline-flex items-center z-30 justify-center rounded-full bg-white group-hover:bg-white/50 dark:group-hover:bg-gray-800/60 group-focus:ring-4 group-focus:ring-white dark:group-focus:ring-gray-800/70 group-focus:outline-none"
                      style={{ width: "3vw", height: "3vw" }}
                    >
                      <img src="/images/arrowLeft.png" alt="" style={{ width: "1.5vw" }} />
                      <span className="sr-only">Next</span>
                    </span>
                  </button>
                </div>
                :
                <img src="/images/NoCompImg.png" alt="" className='compNoImg' />
              }
            </div>
            <div className={companyData[0].title == "" ? 'company-title-empty' : 'company-title-full'}>
              <img src="/images/titleIcon.png" alt="" />
              <h3>
                {companyData[0].title == "" ? "Титул" : companyData[0].title }
              </h3>
            </div>
            <div className='company-about'>
              <h3>
                О конторе
              </h3>
              <p className={companyData[0].description == "" ? 'empty' : 'info'}>
                {companyData[0].description == "" 
                ? 
                'Пусто...' 
                : 
                <ReadMoreReact
                  text={companyData[0].description}
                  min={120}
                  ideal={350}
                  max={770}
                  readMoreText={<span style={{
                    cursor: "pointer",
                    color: "#0060CE",
                    fontSize: "1.1vw",
                    textDecoration:"underline"
                  }}>
                    Читать больше
                  </span>}
                  />}
                
              </p>
            </div>
            <div className='company-add'>
              <h3>
                Примечание
              </h3>
              <p className={companyData[0].additionals.length == 0 ? 'empty' : 'info'}>
                {companyData[0].additionals.length == 0
                ? 
                'Пусто...' 
                : 
                companyData[0].additionals.map((item,index)=>{
                  return(
                    <p key={index}>
                    ✨ {item}
                    </p>
                  )
                })
                }
              </p>
            </div>
            <div className='company-number'>
              <h3>
                Номер телефона
              </h3>
              <div className='company-number-list'>
                {
                  companyData[0].phone.map((item, index) => {
                    return (
                      <div className='company-number-card' key={index}>
                        <img src="/images/callIcon.png" alt="" />
                        <a href="">
                          {item}
                        </a>
                      </div>
                    )
                  })
                }
              </div>
            </div>
            {
              companyData[0].social_media.length > 0
                ?
                <div className='company-social'>
                  <h3>
                    Социальные сети
                  </h3>
                  <div className='company-social-list'>
                    {
                      companyData[0].social_media.map((item, index) => {
                        return (
                          <div className='company-social-card' key={index}>
                            <img src={`/images/${item.type}.png`} alt="" />
                            <a href={item.link}>
                              {item.type}
                            </a>
                            <img src="/images/arrowLeft.png" alt="" />
                          </div>
                        )
                      })
                    }
                  </div>
                </div>
                :
                null
            }
          </div>
          <div className="company-facilities">
            <h3>
              Удобства
            </h3>
            <div className="facilities-list">
              {
                companyData[0].facilities.map((item, index) => {
                  return (
                    <div key={index} className='facilities-list-item'>
                      <img src={item.value ? item.icon + "true.png" : item.icon + ".png"} alt="" />
                      <p style={{
                        color: item.value ? "#2C2C2C" : "#2C2C2C80",
                        textDecoration: item.value ? "none" : "line-through"
                      }}>
                        {t(item.name)}
                      </p>
                    </div>
                  )
                })
              }
            </div>
          </div>
          <div className="company-comments">
            <h3>
              Комментарии ({salonComments.length})
            </h3>
            {
              salonComments.length == 0
                ?
                <div style={{
                  padding: "10vh",
                  textAlign: "center"
                }}>
                  <img src="/images/noComments.png" alt="" style={{
                    margin: "0 auto"
                  }} />
                  <h2 style={{
                    color: "#A8A8B3"
                  }}>
                    Комментарии пока что нет
                  </h2>
                </div>
                :
                <div>
                  {
                    salonComments.map((item, index) => {
                      return (
                        <div key={index} className='comment-card'>
                          <div className='comment-author'>
                            <img src={'/images/customerImage.png'} alt="" />
                            <h3>
                              {item.customer_name}
                            </h3>
                          </div>
                          <p>
                            {item.comment}
                          </p>
                          <div className='comment-bottom'>
                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5vw"
                            }}>
                              <div
                                className="stars"
                                style={{ '--rating': item.rating }}
                                aria-label={`Rating: ${item.rating} out of 5 stars`}
                              >
                              </div>
                              <p style={{ fontSize: "0.8vw", paddingTop: "0.1vw" }}>
                                ({item.rating})
                              </p>
                            </div>
                            <div className='comment-date'>
                              {
                                item.date
                              }
                            </div>
                          </div>
                        </div>
                      )
                    })
                  }
                </div>
            }
          </div>
        </div>
        <div className="profile-body-right">
          <div className="payment-system">
            <h3>
              Система монетизации
            </h3>
            <div className='payment-system-bottom'>
              <div className='payment-system-summ'>
                <div className='payment-system-summ-top'>
                  <img src="/images/paymentTop.png" alt="" />
                  <h4>
                    Было оплачено
                  </h4>
                </div>
                <div style={{ minHeight: "10vh", display: "flex", alignItems: "end" }}>
                  <h1>
                    {formatSumm(companyData[0].paymentSystem.summ)}
                  </h1>
                  <p>
                    UZS
                  </p>
                </div>
              </div>
              <div className='payment-system-card'>
                <div className='payment-system-card-top'>
                  <img src="/images/paymentCard.png" alt="" />
                  <h4>
                    Привязанная карта
                  </h4>
                </div>
                <div className='payment-system-card-bottom'>
                  <p>
                    <span>
                      {companyData[0].paymentSystem.card_number.split('').map((item, index) => {
                        if (index <= 3) {
                          return item
                        }
                      })}
                    </span>
                    <span>
                      **** ****
                    </span>
                    <span>
                      {companyData[0].paymentSystem.card_number.split('').map((item, index) => {
                        if (index >= 12) {
                          return item
                        }
                      })}
                    </span>
                  </p>
                  <h3>
                    {companyData[0].paymentSystem.card_type}
                  </h3>
                </div>
              </div>
            </div>
          </div>
          <div className="company-location">
            <div className='company-location-top'>
              <h3>
                Местоположение
              </h3>
            </div>
            <div className='company-location-map'>
              <YandexMap lat={companyData[0].location.lat} long={companyData[0].location.long} />
            </div>
            <div className='company-location-bottom'>
              <div className='company-location-address'>
                <img src="/images/markerMap.png" alt="" />
                <p>
                  ул. Мустакиллик, 12, Ташкент
                </p>
              </div>
              <div className='company-location-navigate'>
                <img src="/images/navigateMap.png" alt="" />
                <p>
                  ст. метро: Мустакиллик майдони
                </p>
              </div>
            </div>
          </div>
          <div className="company-clients">
            <h3>
              Постоянные клиенты
            </h3>
            <div>
              {
                companyData[0].top_clients.length > 0
                  ?
                  companyData[0].top_clients.map((item, index) => {
                    return (
                      <div className='company-clients-card' key={index}>
                        <img src="/images/customerImage.png" alt="" className='top-client-image' />
                        <div className='company-clients-card-info'>
                          <img src="/images/profileTopClient.png" alt="" />
                          <p>
                            {item.name}
                          </p>
                          <img src="/images/callingBlackIcon.png" alt="" />
                          <a href="">
                            {item.phone}
                          </a>
                          <img src="/images/visitsIcon.png" alt="" />
                          <p>
                            {item.visits} посещений
                          </p>
                        </div>
                      </div>
                    )
                  })
                  :
                  <div>
                    <img
                      src="/images/noClientsImg.png"
                      style={{
                        margin: "10vh auto 2vh auto",
                        width: "7vw"
                      }}
                      alt=""
                    />
                    <p style={{ color: "#A8A8B3", textAlign: "center", fontSize: "1vw" }}>
                      Постоянных клиентов пока что нет
                    </p>
                  </div>
              }
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Profile