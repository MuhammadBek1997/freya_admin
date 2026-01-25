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

const YandexMap = ({ lat, long, lng, editable = false, onSelect }) => {
    const mapRef = useRef(null);
    const mapInstance = useRef(null); // Xarita obyektini saqlash
    const placemarkInstance = useRef(null); // Marker obyektini saqlash

    // Default koordinatalar (Toshkent markazi)
    const defaultLat = 41.2995;
    const defaultLong = 69.2401;
    
    // Koordinatalarni tekshirish va default qiymatlar berish
    const validLat = (lat && !isNaN(lat) && lat !== null && lat !== undefined) ? parseFloat(lat) : defaultLat;
    const inputLng = (typeof lng !== 'undefined' && lng !== null) ? lng : long;
    const validLong = (inputLng && !isNaN(inputLng) && inputLng !== null && inputLng !== undefined) ? parseFloat(inputLng) : defaultLong;

    useEffect(() => {
        loadYandexMapScript()
            .then((ymaps) => {
                ymaps.ready(() => {
                    // Xarita faqat bir marta yaratiladi
                    if (!mapInstance.current) {
                        mapInstance.current = new ymaps.Map(mapRef.current, {
                            center: [validLat, validLong], // Tekshirilgan koordinatalar
                            zoom: 12, // Masshtab
                            controls: [], // Standart boshqaruv elementlarini olib tashlash
                        }, {
                            suppressMapOpenBlock: true,
                        });

                        // Marker yaratish va qo'shish
                        placemarkInstance.current = new ymaps.Placemark(
                            [validLat, validLong],
                            {},
                            {
                                iconLayout: 'default#image',
                                iconImageHref: '/images/mapMark.png',
                                iconImageSize: [30, 30],
                                iconImageOffset: [-16, -32],
                                draggable: !!editable,
                            }
                        );
                        mapInstance.current.geoObjects.add(placemarkInstance.current);

                        // Editable bo'lsa: marker dragend va xarita click
                        if (editable) {
                            placemarkInstance.current.events.add('dragend', () => {
                                const coords = placemarkInstance.current.geometry.getCoordinates();
                                const [newLat, newLong] = coords;
                                if (typeof onSelect === 'function') {
                                    onSelect({ lat: newLat, lng: newLong });
                                }
                            });

                            mapInstance.current.events.add('click', (e) => {
                                const coords = e.get('coords');
                                if (Array.isArray(coords)) {
                                    const [newLat, newLong] = coords;
                                    placemarkInstance.current.geometry.setCoordinates(coords);
                                    if (typeof onSelect === 'function') {
                                        onSelect({ lat: newLat, lng: newLong });
                                    }
                                }
                            });
                        }
                    } else {
                        // Xarita markazini yangi koordinatalarga o'zgartirish
                        mapInstance.current.setCenter([validLat, validLong], 12, { duration: 300 });
                        // Marker joylashuvini ham yangilash
                        if (placemarkInstance.current) {
                            placemarkInstance.current.geometry.setCoordinates([validLat, validLong]);
                        }
                    }
                });
            })
            .catch((error) => {
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
    }, [validLat, validLong, editable, onSelect]);

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