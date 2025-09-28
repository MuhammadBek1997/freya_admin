import React, { useEffect, useRef } from 'react';

// Yandex Maps API skriptini dinamik yuklash
const loadYandexMapScript = () => {
    return new Promise((resolve, reject) => {
        // Agar API allaqachon yuklangan bo'lsa
        if (window.ymaps && window.ymaps.ready) {
            resolve(window.ymaps);
            return;
        }
        
        // Agar script allaqachon mavjud bo'lsa
        const existingScript = document.querySelector('script[src*="api-maps.yandex.ru"]');
        if (existingScript) {
            existingScript.onload = () => resolve(window.ymaps);
            existingScript.onerror = reject;
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=d2eb60ec-8a2a-4032-a07d-2f155cb11f8a';
        script.async = true;
        script.onload = () => resolve(window.ymaps);
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

const YandexMap = ({ lat, long }) => {
    const mapRef = useRef(null);
    const mapInstance = useRef(null); // Xarita obyektini saqlash
    const placemarkInstance = useRef(null); // Marker obyektini saqlash

    useEffect(() => {
        loadYandexMapScript()
            .then((ymaps) => {
                ymaps.ready(() => {
                    // Xarita faqat bir marta yaratiladi
                    if (!mapInstance.current) {
                        mapInstance.current = new ymaps.Map(mapRef.current, {
                            center: [lat, long], // O‘zgaruvchan koordinatalar
                            zoom: 12, // Masshtab
                            controls: [], // Standart boshqaruv elementlarini olib tashlash
                        }, {
                            // Probka va boshqa qatlamlarni o‘chirish
                            suppressMapOpenBlock: true,
                            yandexMapDisablePoiInteractivity: true, // Interaktiv nuqtalar o‘chiriladi
                        });

                        // Probka qatlamini xavfsiz usulda o'chirish
                        try {
                            const trafficLayer = mapInstance.current.layers.get('yandex#traffic');
                            if (trafficLayer) {
                                mapInstance.current.layers.remove(trafficLayer);
                            }
                        } catch (error) {
                            console.log('Traffic layer removal skipped:', error.message);
                        }
                    }

                    // Eski marker bo‘lsa, uni o‘chirish
                    if (placemarkInstance.current) {
                        mapInstance.current.geoObjects.remove(placemarkInstance.current);
                        placemarkInstance.current = null;
                    }

                    // Yangi marker yaratish (maxsus rasm bilan)
                    placemarkInstance.current = new ymaps.Placemark(
                        [lat, long],
                        {
                            hintContent: 'Joy',
                            balloonContent: 'Belgilangan joy',
                        },
                        {
                            iconLayout: 'default#image',
                            iconImageHref: '/images/mapMark.png', // Maxsus rasm yo‘li
                            iconImageSize: [30, 30], // Rasm o‘lchami (pikselda)
                            iconImageOffset: [-16, -32], // Rasmning markazga nisbatan siljishi
                        }
                    );
                    mapInstance.current.geoObjects.add(placemarkInstance.current);

                    // Xarita markazini yangi koordinatalarga o‘zgartirish
                    mapInstance.current.setCenter([lat, long], 12, { duration: 300 });
                });
            })
            .catch((error) => {
                console.error('Yandex Maps API yuklanmadi:', error);
            });

        // Tozalash: komponent o‘chirilganda xarita va markerlarni yo‘q qilish
        return () => {
            if (placemarkInstance.current) {
                mapInstance.current?.geoObjects.remove(placemarkInstance.current);
                placemarkInstance.current = null;
            }
            if (mapInstance.current) {
                mapInstance.current.destroy();
                mapInstance.current = null;
            }
        };
    }, [lat, long]); // lat va long o‘zgarganda useEffect qayta ishlaydi

    return (
        <div className='yandex-map-cont'>
            <div
                ref={mapRef}
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    );
};

export default YandexMap;