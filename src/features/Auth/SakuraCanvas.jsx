// src/features/Auth/SakuraCanvas.jsx
import React, { useEffect, useRef } from 'react';

const SakuraCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse tracking for 3D wind & interaction
    const mouse = {
      x: width / 2,
      y: height / 2,
      prevX: width / 2,
      prevY: height / 2,
      vx: 0,
      vy: 0,
      radius: 180,
    };

    const handleMouseMove = (e) => {
      mouse.vx = (e.clientX - mouse.prevX) * 0.18;
      mouse.vy = (e.clientY - mouse.prevY) * 0.18;
      mouse.prevX = e.clientX;
      mouse.prevY = e.clientY;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    // Burst petals on click
    const handleClick = (e) => {
      for (let i = 0; i < 20; i++) {
        petals.push(createPetal(e.clientX, e.clientY, true));
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    // Petal colors: Sakura rose palette
    const petalColors = [
      { r: 255, g: 220, b: 232 }, // Light Sakura
      { r: 255, g: 192, b: 203 }, // Soft Pink
      { r: 251, g: 113, b: 133 }, // Rose Sakura
      { r: 244, g: 114, b: 182 }, // Deep Blossom
      { r: 255, g: 242, b: 246 }, // Pale Petal
    ];

    const createPetal = (startX, startY, isBurst = false) => {
      const color = petalColors[Math.floor(Math.random() * petalColors.length)];
      const speedMult = Math.random() * 0.8 + 0.6;
      return {
        x: startX !== undefined ? startX : Math.random() * (width + 200) - 100,
        y: startY !== undefined ? startY : Math.random() * -height * 0.4,
        z: Math.random() * 800 - 400,
        size: Math.random() * 9 + 11,
        vx: isBurst ? (Math.random() - 0.5) * 9 : (Math.random() - 0.15) * 1.6,
        vy: isBurst ? (Math.random() - 0.5) * 9 : (Math.random() * 1.2 + 1.1) * speedMult,
        vz: (Math.random() - 0.5) * 1.5,
        pitch: Math.random() * Math.PI * 2,
        roll: Math.random() * Math.PI * 2,
        yaw: Math.random() * Math.PI * 2,
        pitchSpeed: (Math.random() - 0.5) * 0.04,
        rollSpeed: (Math.random() - 0.5) * 0.04,
        yawSpeed: (Math.random() - 0.5) * 0.03,
        color: color,
        opacity: Math.random() * 0.35 + 0.6,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.02 + 0.015,
        life: isBurst ? 140 : Infinity,
      };
    };

    const PETAL_COUNT = 70;
    const petals = [];
    for (let i = 0; i < PETAL_COUNT; i++) {
      const p = createPetal();
      p.y = Math.random() * height;
      petals.push(p);
    }

    // Draw single 3D Sakura Petal
    const drawPetal = (p, projectedX, projectedY, scale) => {
      ctx.save();
      ctx.translate(projectedX, projectedY);
      ctx.rotate(p.yaw);
      ctx.scale(scale * Math.cos(p.pitch), scale * Math.cos(p.roll));

      const size = p.size;
      const grad = ctx.createRadialGradient(0, -size * 0.2, 1, 0, 0, size);
      grad.addColorStop(0, `rgba(${p.color.r + 15}, ${p.color.g + 15}, ${p.color.b + 15}, ${p.opacity * 0.95})`);
      grad.addColorStop(0.7, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.opacity * 0.8})`);
      grad.addColorStop(1, `rgba(${p.color.r - 25}, ${p.color.g - 35}, ${p.color.b - 25}, ${p.opacity * 0.55})`);

      ctx.fillStyle = grad;
      ctx.shadowColor = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0.35)`;
      ctx.shadowBlur = 6 * scale;

      // Realistic notched Sakura petal
      ctx.beginPath();
      ctx.moveTo(0, size * 0.85);
      ctx.bezierCurveTo(-size * 0.9, size * 0.3, -size * 0.75, -size * 0.7, -size * 0.2, -size * 0.95);
      ctx.lineTo(0, -size * 0.75);
      ctx.lineTo(size * 0.2, -size * 0.95);
      ctx.bezierCurveTo(size * 0.75, -size * 0.7, size * 0.9, size * 0.3, 0, size * 0.85);
      ctx.closePath();
      ctx.fill();

      // Delicate center vein
      ctx.strokeStyle = `rgba(255, 255, 255, ${p.opacity * 0.4})`;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(0, size * 0.75);
      ctx.lineTo(0, -size * 0.35);
      ctx.stroke();

      ctx.restore();
    };

    const fov = 650;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      mouse.vx *= 0.92;
      mouse.vy *= 0.92;

      for (let i = petals.length - 1; i >= 0; i--) {
        const p = petals[i];

        p.pitch += p.pitchSpeed;
        p.roll += p.rollSpeed;
        p.yaw += p.yawSpeed;
        p.swayPhase += p.swaySpeed;

        const naturalWindX = Math.sin(p.swayPhase) * 1.1 + 0.6;
        const naturalWindY = Math.cos(p.swayPhase * 0.8) * 0.3 + 1.25;

        p.x += p.vx + naturalWindX;
        p.y += p.vy + naturalWindY;
        p.z += p.vz;

        // Interactive mouse wind
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius && dist > 0) {
          const force = (1 - dist / mouse.radius) * 4.0;
          p.vx += (dx / dist) * force + mouse.vx * 0.45;
          p.vy += (dy / dist) * force + mouse.vy * 0.45;
          p.pitchSpeed += (Math.random() - 0.5) * 0.06;
          p.rollSpeed += (Math.random() - 0.5) * 0.06;
        }

        p.vx *= 0.96;
        p.vy = Math.max(0.6, p.vy * 0.98);

        if (p.life !== Infinity) {
          p.life--;
          p.opacity *= 0.985;
          if (p.life <= 0 || p.opacity <= 0.02) {
            petals.splice(i, 1);
            continue;
          }
        }

        const cameraZ = 800;
        const projectedZ = cameraZ + p.z;
        if (projectedZ <= 50) continue;

        const scale = fov / projectedZ;
        const projX = (p.x - width / 2) * scale + width / 2;
        const projY = (p.y - height / 2) * scale + height / 2;

        drawPetal(p, projX, projY, scale);

        if (p.y > height + 50 || p.x < -120 || p.x > width + 120) {
          if (p.life === Infinity) {
            p.x = Math.random() * (width + 200) - 100;
            p.y = -40;
            p.z = Math.random() * 800 - 400;
            p.vx = (Math.random() - 0.2) * 1.5;
            p.vy = Math.random() * 1.4 + 1.0;
          } else {
            petals.splice(i, 1);
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    />
  );
};

export default SakuraCanvas;
