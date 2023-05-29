async function init() {
    const grid = document.querySelector(".grid");
    const msnry = new Masonry(".grid", {
      itemSelector: ".item",
      columnWidth: ".grid-sizer",
      percentPosition: true,
      horizontalOrder: true,
      initLayout: true,
      originLeft: false,
      originTop: true
    });
  
    imagesLoaded(grid).on("progress", function () {
      msnry.layout();
    });
  
    function lazyLoadImages() {
      const images = document.querySelectorAll("img[data-src]");
  
      if ("IntersectionObserver" in window) {
        const imgObserver = new IntersectionObserver(
          (entries, observer) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
  
              const img = entry.target;
              img.src = img.dataset.src;
              img.removeAttribute("data-src");
              observer.unobserve(img);
            });
          },
          {
            rootMargin: "0px 0px 50px 0px",
            threshold: 0
          }
        );
  
        images.forEach((img) => imgObserver.observe(img));
      } else {
        Array.from(images).forEach((img) => {
          img.src = img.dataset.src;
          img.removeAttribute("data-src");
        });
      }
    }
  
    if ("requestIdleCallback" in window) {
      requestIdleCallback(lazyLoadImages);
    } else {
      window.addEventListener("DOMContentLoaded", lazyLoadImages);
    }
  
    const imageWrapper = document.getElementById("image-wrapper");
    const lightbox = document.getElementById("lightbox");
    const lightboxImage = document.getElementById("lightbox-image");
    const closeBtn = Button("close", "Close lightbox");
    const prevBtn = Button("prev", "Previous image");
    const nextBtn = Button("next", "Next image");
    const fullscreenBtn = Button("fullscreen", "Toggle fullscreen");
    const printBtn = Button("print", "Print image");
    const flipVerticalBtn = Button("flip-vertical", "Flip image vertically");
    const flipHorizontalBtn = Button(
      "flip-horizontal",
      "Flip image horizontally"
    );
    const rotateLeftBtn = Button("rotate-left", "Rotate image to the left");
    const rotateRightBtn = Button("rotate-right", "Rotate image to the right");
  
    function setAttributes(element, attributes) {
      for (let attribute in attributes) {
        element.setAttribute(attribute, attributes[attribute]);
      }
    }
  
    function Button(id, ariaLabel) {
      const button = document.getElementById(id);
      setAttributes(button, {
        "aria-label": ariaLabel,
        tabindex: 0,
        role: "button"
      });
      return button;
    }
  
    const buttons = [
      closeBtn,
      prevBtn,
      nextBtn,
      fullscreenBtn,
      printBtn,
      flipVerticalBtn,
      flipHorizontalBtn,
      rotateLeftBtn,
      rotateRightBtn
    ];
  
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-labelledby", "lightbox-title");
    lightbox.setAttribute("aria-describedby", "lightbox-description");
  
    buttons.forEach((button) => {
      button.addEventListener("click", (event) => event.stopPropagation());
    });
  
    const items = document.querySelectorAll(".item");
    let currentItem;
  
    let scale = 1;
    let isMoving = false;
    let mouseX, mouseY;
    let translateX = 0;
    let translateY = 0;
    let initialPinchDistance = 0;
    let initialScale = 1;
  
    function adjustImageSize() {
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;
      const imgHeight = lightboxImage.naturalHeight;
      const imgWidth = lightboxImage.naturalWidth;
  
      const scaleFactor = Math.min(
        windowHeight / imgHeight,
        windowWidth / imgWidth
      );
  
      if (scaleFactor < 1) {
        lightboxImage.style.height = `${imgHeight * scaleFactor}px`;
        lightboxImage.style.width = `${imgWidth * scaleFactor}px`;
      } else {
        lightboxImage.style.height = "100%";
        lightboxImage.style.width = "100%";
      }
    }
  
    lightboxImage.addEventListener("load", adjustImageSize);
  
    async function loadImage(src) {
      return new Promise((resolve, reject) => {
        lightboxImage.src = src;
        lightboxImage.onload = () => resolve();
        lightboxImage.onerror = () =>
          reject(new Error(`Failed to load image: ${src}`));
      });
    }
  
    items.forEach((item, index) => {
      item.addEventListener("click", async (e) => {
        e.preventDefault();
        currentItem = index;
  
        await loadImage(e.target.closest("a").href);
  
        lightbox.classList.add("active");
        lightboxImage.src = e.target.closest("a").href;
        lightboxImage.alt = e.target.closest("img").alt;
  
        document.getElementById("image-counter").innerText = `${
          currentItem + 1
        } / ${items.length}`;
  
        updateTitleAndDescription(currentItem);
  
        lightbox.style.display = "flex";
        gsap.fromTo(lightboxImage, { scale: 0 }, { scale: 1, duration: 1 });
      });
    });
  
    function updateTitleAndDescription(index) {
      const item = items[index];
  
      const imgElement = item.querySelector("img");
  
      const titleId = imgElement
        ? imgElement.getAttribute("aria-labelledby")
        : null;
      if (titleId) {
        const title = document.getElementById(titleId).textContent;
        document.getElementById("lightbox-title").textContent = title;
      } else {
        document.getElementById("lightbox-title").textContent = "";
      }
  
      const descriptionId = imgElement
        ? imgElement.getAttribute("aria-describedby")
        : null;
      if (descriptionId) {
        const description = document.getElementById(descriptionId).textContent;
        document.getElementById("lightbox-description").textContent = description;
      } else {
        document.getElementById("lightbox-description").textContent = "";
      }
  
      lightbox.setAttribute("aria-labelledby", "lightbox-title");
      lightbox.setAttribute("aria-describedby", "lightbox-description");
    }
  
    function closeLightbox() {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      lightbox.style.display = "none";
      items[currentItem].focus();
    }
  
    function changeImage(direction) {
      resetImageAndAnimation(); // Add this line here to reset the image before changing the source
      currentItem = (currentItem + direction + items.length) % items.length;
      lightboxImage.src = items[currentItem].querySelector("a").href;
      updateTitleAndDescription(currentItem);
      document.getElementById("image-counter").innerText = `${
        currentItem + 1
      } / ${items.length}`;
    }
  
    function resetImageAndAnimation() {
      gsap.to(lightboxImage, {
        xPercent: 0,
        yPercent: 0,
        opacity: 1,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        duration: 0
      });
      rotation = 0;
      scaleX = 1;
      scaleY = 1;
      scale = 1;
      translateX = 0;
      translateY = 0;
  
      document.getElementById(
        "image-wrapper"
      ).style.transform = `translate(0px, 0px) scale(1)`;
    }
  
    lightbox.addEventListener("click", (event) => {
      if (!imageWrapper.contains(event.target)) {
        closeLightbox();
        resetImageAndAnimation();
      }
    });
  
    function transformImage() {
      gsap.set(document.getElementById("image-wrapper"), {
        x: translateX,
        y: translateY,
        scale: scale
      });
    }
  
    function animateImage(direction) {
      resetImageAndAnimation();
  
      gsap.to(lightboxImage, {
        xPercent: 100 * direction,
        opacity: 0,
        duration: 1,
        onComplete: () => {
          changeImage(direction);
          gsap.fromTo(
            lightboxImage,
            { xPercent: -100 * direction, opacity: 0 },
            { xPercent: 0, opacity: 1, duration: 1 }
          );
        }
      });
    }
  
    prevBtn.addEventListener("click", () => animateImage(-1));
    nextBtn.addEventListener("click", () => animateImage(1));
    printBtn.addEventListener("click", printImage);
    closeBtn.addEventListener("click", () => {
      gsap.to(lightboxImage, { scale: 0, duration: 1 });
      setTimeout(() => {
        closeLightbox();
        resetImageAndAnimation();
      }, 1000);
    });
  
    let rotation = 0;
    let scaleX = 1;
    let scaleY = 1;
  
    rotateRightBtn.addEventListener("click", () => {
      rotation += 90;
      gsap.to(lightboxImage, { rotation: rotation, duration: 1 });
    });
  
    rotateLeftBtn.addEventListener("click", () => {
      rotation -= 90;
      gsap.to(lightboxImage, { rotation: rotation, duration: 1 });
    });
  
    flipHorizontalBtn.addEventListener("click", () => {
      scaleX *= -1;
      gsap.to(lightboxImage, { scaleX: scaleX, duration: 1 });
    });
  
    flipVerticalBtn.addEventListener("click", () => {
      scaleY *= -1;
      gsap.to(lightboxImage, { scaleY: scaleY, duration: 1 });
    });
  
    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        lightbox.requestFullscreen().catch((err) => {
          console.error(
            `Error attempting to enable full-screen mode: ${err.message} (${err.name})`
          );
        });
      } else {
        document.exitFullscreen();
      }
    }
  
    fullscreenBtn.addEventListener("click", toggleFullscreen);
  
    document.addEventListener("fullscreenchange", () => {
      const icon = fullscreenBtn.querySelector("i");
      if (document.fullscreenElement) {
        icon.classList.remove("fa-expand");
        icon.classList.add("fa-compress");
      } else {
        icon.classList.remove("fa-compress");
        icon.classList.add("fa-expand");
      }
    });
  
    const SCALE_INCREMENT = 0.1;
    const MIN_SCALE = 0.5;
    const MAX_SCALE = 3;
  
    window.addEventListener("keydown", (e) => {
      if (lightbox.style.display === "none") return;
      if (e.key === "Escape") {
        closeLightbox();
      } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        changeImage(-1);
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        changeImage(1);
      } else if (e.key === "+" || e.key === "=") {
        scale = Math.min(MAX_SCALE, scale + SCALE_INCREMENT);
        transformImage();
      } else if (e.key === "-" || e.key === "_") {
        scale = Math.max(MIN_SCALE, scale - SCALE_INCREMENT);
        transformImage();
      } else if (e.key === "0") {
        resetImageAndAnimation();
      }
    });
  
    lightboxImage.addEventListener("mousedown", (e) => {
      isMoving = true;
      mouseX = e.clientX;
      mouseY = e.clientY;
    });
  
    lightboxImage.addEventListener("mousemove", (e) => {
      if (isMoving) {
        requestAnimationFrame(() => {
          translateX += e.clientX - mouseX;
          translateY += e.clientY - mouseY;
          mouseX = e.clientX;
          mouseY = e.clientY;
          transformImage();
        });
      }
    });
  
    lightboxImage.addEventListener("mouseup", () => {
      isMoving = false;
    });
  
    lightboxImage.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        isMoving = true;
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
        e.target.setAttribute("aria-grabbed", "true");
      } else if (e.touches.length === 2) {
        isMoving = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
        initialScale = scale;
      }
    });
  
    lightboxImage.addEventListener("touchmove", (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && isMoving) {
        const deltaX = e.touches[0].clientX - mouseX;
        const deltaY = e.touches[0].clientY - mouseY;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Swipe
          if (deltaX > 50) {
            changeImage(-1);
            isMoving = false;
          } else if (deltaX < -50) {
            changeImage(1);
            isMoving = false;
          }
        } else {
          // Move image
          translateX += deltaX;
          translateY += deltaY;
          mouseX = e.touches[0].clientX;
          mouseY = e.touches[0].clientY;
          transformImage();
        }
      } else if (e.touches.length === 2) {
        // Pinch-to-Zoom
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        scale = initialScale * (distance / initialPinchDistance);
        scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
        transformImage();
      }
    });
  
    lightboxImage.addEventListener("touchend", (e) => {
      e.target.setAttribute("aria-grabbed", "false");
      if (e.touches.length === 0) {
        isMoving = false;
        if (e.changedTouches.length === 1) {
          const dx = e.changedTouches[0].clientX - mouseX;
          const dy = e.changedTouches[0].clientY - mouseY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 5) {
            closeLightbox();
          }
        }
      }
    });
  
    lightboxImage.addEventListener("wheel", (e) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        scale = Math.min(MAX_SCALE, scale + SCALE_INCREMENT);
      } else {
        scale = Math.max(MIN_SCALE, scale - SCALE_INCREMENT);
      }
      transformImage();
    });
  }
  
  const items = document.querySelectorAll(".item");
  
  items.forEach((item) => {
    const img = item.querySelector("img");
    const caption = item.querySelector(".figure-caption");
  
    const timeline = gsap.timeline({ paused: true });
  
    timeline
      .to(img, {
        scale: 2,
        rotate: 10,
        boxShadow: "0px 0px 10px 2px rgba(0,0,0,0.5)",
        duration: 0.5
      })
      .fromTo(
        caption,
        { yPercent: 100, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 1 }
      );
  
    item.addEventListener("mouseover", () => {
      timeline.play();
    });
  
    item.addEventListener("mouseout", () => {
      timeline.reverse();
    });
  });

function printImages() {
    const images = document.querySelectorAll(".img-fluid");
    images.forEach((image) => {
        printImage(image.src);
    });
}
  
  function protectImages() {
    ["contextmenu", "dragstart"].forEach((eventType) => {
      document.addEventListener(eventType, (event) => {
        if (event.target.tagName === "IMG") event.preventDefault();
      });
    });
  }
  
  protectImages();
  
  init();
  