import React from 'react';

const ClientStatsCard = ({ currentMonth = 1700, previousMonth = 1400 }) => {
  
  // Oldingi oydan hozirgi oygacha o'sish/kamayish grafigi
  const generateChartData = (prev, current) => {
    const points = 12;
    const data = [];
    const difference = current - prev;
    const step = difference / (points - 1);
    
    // Grafik uchun random tebranishlar qo'shish
    for (let i = 0; i < points; i++) {
      const baseValue = prev + (step * i);
      const noise = (Math.random() - 0.5) * (Math.abs(difference) * 0.15);
      const value = 30 + ((baseValue - prev) / (current - prev + 1)) * 40 + noise;
      data.push(Math.max(10, Math.min(70, value)));
    }
    
    return data;
  };
  
  const chartData = generateChartData(previousMonth, currentMonth);
  
  // SVG path yaratish
  const createPath = (data) => {
    const width = 280;
    const height = 80;
    const step = width / (data.length - 1);
    
    let path = `M 0,${height - data[0]}`;
    
    for (let i = 1; i < data.length; i++) {
      const x = step * i;
      const y = height - data[i];
      path += ` L ${x},${y}`;
    }
    
    path += ` L ${width},${height} L 0,${height} Z`;
    
    return path;
  };
  
  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace('.', ',') + ' тис';
    }
    return num.toString();
  };
  
  // O'sish foizini hisoblash
  const getGrowthPercentage = () => {
    if (previousMonth === 0) return 0;
    return (((currentMonth - previousMonth) / previousMonth) * 100).toFixed(1);
  };
  
  const growthPercent = getGrowthPercentage();
  const isGrowing = currentMonth >= previousMonth;
  
  return (
    <div style={{
      width: '100%',
      height: '100%',
      minHeight: '160px',
      background: 'linear-gradient(135deg, #8b3de8 0%, #6b2dc5 100%)',
      borderRadius: '16px',
      padding: '16px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 8px 24px rgba(139, 61, 232, 0.25)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="white"/>
              <path d="M12 14C6.48 14 2 16.48 2 19.5V22H22V19.5C22 16.48 17.52 14 12 14Z" fill="white"/>
            </svg>
          </div>
          <span style={{
            color: 'white',
            fontSize: 'clamp(12px, 1vw, 16px)',
            fontWeight: '500',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            Клиентов за месяц
          </span>
        </div>
        
        {/* O'sish ko'rsatkichi */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          backgroundColor: isGrowing ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          padding: '2px 6px',
          borderRadius: '6px'
        }}>
          <span style={{
            fontSize: 'clamp(11px, 0.9vw, 14px)',
            fontWeight: '600',
            color: isGrowing ? '#86efac' : '#fca5a5',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            {isGrowing ? '↑' : '↓'} {Math.abs(growthPercent)}%
          </span>
        </div>
      </div>
      
      {/* Number */}
      <div style={{
        fontSize: 'clamp(26px, 2.2vw, 42px)',
        fontWeight: '700',
        color: 'white',
        marginBottom: '8px',
        position: 'relative',
        zIndex: 2,
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        {formatNumber(currentMonth)}
      </div>
      
      {/* Chart */}
      <div style={{
        position: 'absolute',
        bottom: '8px',
        left: '16px',
        right: '16px',
        height: '80px',
        zIndex: 1
      }}>
        <svg viewBox="0 0 280 80" width="100%" height="100%" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: 'rgba(255, 255, 255, 0.3)', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: 'rgba(255, 255, 255, 0.05)', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <path
            d={createPath(chartData)}
            fill="url(#chartGradient)"
            stroke="rgba(255, 255, 255, 0.5)"
            strokeWidth="2"
          />
        </svg>
      </div>
    </div>
  );
};

export default ClientStatsCard;