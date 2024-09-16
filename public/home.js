document.addEventListener("DOMContentLoaded", () => {
  const image1 = document.getElementById("image1");
  const image2 = document.getElementById("image2");

  // Function to toggle images
  function fadeImages() {
    if (image1.style.opacity == 1) {
      image1.style.opacity = 0;
      image2.style.opacity = 1;
    } else {
      image1.style.opacity = 1;
      image2.style.opacity = 0;
    }
  }

  // Fade every 5 seconds (5000 milliseconds)
  setInterval(fadeImages, 5000);
});
