import React, { useState, useCallback } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const ImageWatermark = () => {
  const [images, setImages] = useState([]);
  const [watermarkedImages, setWatermarkedImages] = useState([]);
  const [error, setError] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('warehouse1');
  const [selectedTitle, setSelectedTitle] = useState('title1');

  // 仓库地址
  const warehouseAddresses = ["新疆维吾尔自治区乌鲁木齐市沙依巴克区苜蓿沟南路沙依巴克区佳好文化发展有限公司(首蓿沟南路东)","新疆维吾尔自治区乌鲁术齐市沙依巴克区苜蓿沟南路九冶建设中国智能骨干网(新疆)核心节点项目部"]
    

  const titles = {
    title1: "福******场_多多买菜",
    title2: "炫朝云仓 (含冷库)"
  }

  const phones = {
    title1: "199*****306",
    title2: "189*****653"
  }

  // Watermark parameters
  const watermarkWidth = 650;
  const watermarkOpacity = 0.4;
  const titleFontSize = 35;
  const contentFontSize = 25;
  const lineSpacing = 1.5;
  const letterSpacing = 2;

  const handleImageUpload = useCallback((event) => {
    const files = Array.from(event.target.files);
    const promises = files.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises)
      .then(results => {
        setImages(results);
        setError(null);
      })
      .catch(() => {
        setError('Error reading one or more files. Please try again.');
      });
  }, []);

  // const getRandomTime = (start, end) => {
  //   const startDate = new Date(start);
  //   const endDate = new Date(end);
  //   const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
  //   return randomDate.toLocaleString('zh-CN', { 
  //     year: 'numeric', 
  //     month: '2-digit', 
  //     day: '2-digit', 
  //     hour: '2-digit', 
  //     minute: '2-digit', 
  //     second: '2-digit', 
  //     hour12: false 
  //   }).replace(/\//g, '-');
  // };
  const getRandomTime = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));

    // 格式化日期，精确到秒
    const year = randomDate.getFullYear();
    const month = String(randomDate.getMonth() + 1).padStart(2, '0');
    const day = String(randomDate.getDate()).padStart(2, '0');
    const hours = String(randomDate.getHours()).padStart(2, '0');
    const minutes = String(randomDate.getMinutes()).padStart(2, '0');
    const seconds = String(randomDate.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };
  
  const applyWatermark = useCallback(() => {
    if (images.length === 0) {
      setError('Please upload at least one image first.');
      return;
    }

    if (!startTime || !endTime) {
      setError('Please select both start and end times.');
      return;
    }

    const watermarkPromises = images.map(imageData => {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
          canvas.width = 720;
          canvas.height = 960;

          const scale = Math.max(720 / img.width, 960 / img.height);
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;

          const x = (720 - scaledWidth) / 2;
          const y = (960 - scaledHeight) / 2;

          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

          const padding = 15;
          const cornerRadius = 25;

          // Watermark text
          const title = titles[selectedTitle];
          // const address = warehouseAddresses[selectedWarehouse];
          const address = warehouseAddresses[Math.floor(Math.random() * warehouseAddresses.length)];
          const time = getRandomTime(startTime, endTime);
          const phone = phones[selectedTitle];

          const drawTextWithSpacing = (text, x, y, fontSize) => {
            ctx.font = `${fontSize}px sans-serif`;
            let totalWidth = 0;
            for (let i = 0; i < text.length; i++) {
              const char = text[i];
              const charWidth = ctx.measureText(char).width;
              ctx.fillText(char, x + totalWidth, y);
              totalWidth += charWidth + letterSpacing;
            }
            return totalWidth;
          };

          const wrapText = (text, maxWidth) => {
            const words = text.split('');
            const lines = [];
            let currentLine = words[0];

            for (let i = 1; i < words.length; i++) {
              const word = words[i];
              const width = ctx.measureText(currentLine + word).width + (currentLine.length * letterSpacing);
              if (width < maxWidth) {
                currentLine += word;
              } else {
                lines.push(currentLine);
                currentLine = word;
              }
            }
            lines.push(currentLine);
            return lines;
          };

          ctx.font = `${titleFontSize}px sans-serif`;
          const titleLines = wrapText(title, watermarkWidth - padding * 2);
          const titleHeight = titleFontSize * lineSpacing * titleLines.length;

          ctx.font = `${contentFontSize}px sans-serif`;
          const addressLines = wrapText(address, watermarkWidth - padding * 2);
          const timeLines = wrapText(time, watermarkWidth - padding * 2);
          const phoneLines = wrapText(phone, watermarkWidth - padding * 2);

          const contentHeight = contentFontSize * lineSpacing * (addressLines.length + timeLines.length + phoneLines.length);

          const watermarkHeight = titleHeight + contentHeight + padding * 2;

          const watermarkX = 20;
          const watermarkY = canvas.height - watermarkHeight - 20;

          ctx.fillStyle = `rgba(0, 0, 0, ${watermarkOpacity})`;
          ctx.beginPath();
          ctx.moveTo(watermarkX + cornerRadius, watermarkY);
          ctx.lineTo(watermarkX + watermarkWidth - cornerRadius, watermarkY);
          ctx.quadraticCurveTo(watermarkX + watermarkWidth, watermarkY, watermarkX + watermarkWidth, watermarkY + cornerRadius);
          ctx.lineTo(watermarkX + watermarkWidth, watermarkY + watermarkHeight - cornerRadius);
          ctx.quadraticCurveTo(watermarkX + watermarkWidth, watermarkY + watermarkHeight, watermarkX + watermarkWidth - cornerRadius, watermarkY + watermarkHeight);
          ctx.lineTo(watermarkX + cornerRadius, watermarkY + watermarkHeight);
          ctx.quadraticCurveTo(watermarkX, watermarkY + watermarkHeight, watermarkX, watermarkY + watermarkHeight - cornerRadius);
          ctx.lineTo(watermarkX, watermarkY + cornerRadius);
          ctx.quadraticCurveTo(watermarkX, watermarkY, watermarkX + cornerRadius, watermarkY);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = 'white';
          let currentY = watermarkY + padding;

          titleLines.forEach(line => {
            drawTextWithSpacing(line, watermarkX + padding, currentY + titleFontSize, titleFontSize);
            currentY += titleFontSize * lineSpacing;
          });

          [addressLines, timeLines, phoneLines].forEach(lines => {
            lines.forEach(line => {
              drawTextWithSpacing(line, watermarkX + padding, currentY + contentFontSize, contentFontSize);
              currentY += contentFontSize * lineSpacing;
            });
          });

          resolve(canvas.toDataURL('image/jpeg', 0.9));
        };

        img.onerror = () => {
          resolve(null);
        };

        img.src = imageData;
      });
    });

    Promise.all(watermarkPromises)
      .then(results => {
        setWatermarkedImages(results.filter(img => img !== null));
        setError(null);
      })
      .catch(() => {
        setError('Error applying watermark to one or more images. Please try again.');
      });
  }, [images, startTime, endTime, selectedWarehouse, selectedTitle]);

  const handleExport = useCallback(() => {
    const zip = new JSZip();
    watermarkedImages.forEach((img, index) => {
      const imgData = img.split('base64,')[1];
      zip.file(`watermarked_image_${index + 1}.jpg`, imgData, { base64: true });
    });
    zip.generateAsync({ type: "blob" })
      .then(function (content) {
        saveAs(content, "watermarked_images.zip");
      });
  }, [watermarkedImages]);

  return (
    <div className="container mx-auto p-4">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">图片水印工具</h2>
          <div className="space-y-4">
            <input
              type="file"
              onChange={handleImageUpload}
              className="file-input file-input-bordered file-input-accent w-full"
              multiple
            />
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="form-control flex-1">
                <label className="label">
                  <span className="label-text">开始时间</span>
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="input input-bordered w-full"
                />
              </div>
              <div className="form-control flex-1">
                <label className="label">
                  <span className="label-text">结束时间</span>
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="input input-bordered w-full"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="form-control flex-1">
                <label className="label">
                  <span className="label-text">选择标题</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={selectedTitle}
                  onChange={(e) => setSelectedTitle(e.target.value)}
                >
                  <option value="title1">福建******场_多多买菜</option>
                  <option value="title2">炫朝云仓 (含冷库)</option>
                </select>
              </div>
              <div className="form-control flex-1">
                <label className="label">
                  <span className="label-text">选择仓库</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                >
                  <option value="warehouse1">乌鲁木齐仓</option>
                </select>
              </div>
            </div>
            <button
              className="btn btn-accent btn-block"
              onClick={applyWatermark}
              disabled={images.length === 0 || !startTime || !endTime}
            >
              添加水印
            </button>
            {error && <div className="alert alert-error">{error}</div>}
            {watermarkedImages.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {watermarkedImages.map((img, index) => (
                    <img key={index} src={img} alt={`Watermarked ${index + 1}`} className="w-full rounded-lg" />
                  ))}
                </div>
                <button
                  className="btn btn-primary btn-block mt-4"
                  onClick={handleExport}
                >
                  导出所有水印图片
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageWatermark;