
export function launchConfetti() {
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

  for (let i = 0; i < 100; i++) {
    createParticle(colors[Math.floor(Math.random() * colors.length)]);
  }
}

function createParticle(color) {
  const particle = document.createElement('div');
  particle.style.position = 'fixed';
  particle.style.width = '10px';
  particle.style.height = '10px';
  particle.style.backgroundColor = color;
  particle.style.left = Math.random() * 100 + 'vw';
  particle.style.top = '-10px';
  particle.style.opacity = '1';
  particle.style.pointerEvents = 'none';
  particle.style.zIndex = '9999';
  particle.style.transform = `rotate(${Math.random() * 360}deg)`;

  // Physics
  const speed = 2 + Math.random() * 5;
  const angle = Math.random() * 20 - 10; // Slight drift

  document.body.appendChild(particle);

  const animation = particle.animate([
    { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
    { transform: `translate(${Math.random() * 100 - 50}px, 100vh) rotate(${Math.random() * 720}deg)`, opacity: 0 }
  ], {
    duration: 2000 + Math.random() * 1000,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  });

  animation.onfinish = () => {
    particle.remove();
  };
}
