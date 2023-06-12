function init() {
  const grid = document.querySelector(".grid");
  const msnry = new Masonry(".grid", {
    itemSelector: ".item",
    columnWidth: ".grid-sizer",
    percentPosition: true,
    horizontalOrder: true,
    initLayout: true,
    originLeft: false,
    originTop: true,
  });

  imagesLoaded(grid).on("progress", function () {
    msnry.layout();
  });

  const observerOptions = {
    rootMargin: "0px 0px 50px 0px",
    threshold: 0,
  };
  
  function createObserver() {
    return new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
  
          img.src = img.dataset.src;
          img.removeAttribute("data-src");
  
          observer.unobserve(img);
        }
      });
    }, observerOptions);
  }
  
  function lazyLoadImages() {
    const images = document.querySelectorAll("img[data-src]");
    const imgObserver = createObserver();
  
    images.forEach((img) => {
      if ("IntersectionObserver" in window) {
        imgObserver.observe(img);
      } else {
        img.src = img.dataset.src;
        img.removeAttribute("data-src");
      }
    });
  }
  
  if ("requestIdleCallback" in window) {
    window.addEventListener("requestIdleCallback", lazyLoadImages);
  } else {
    window.addEventListener("DOMContentLoaded", lazyLoadImages);
  }

  const imageWrapper = document.getElementById("image-wrapper");
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightbox-image");
  const closeBtn = Button("close", "Close lightbox");
  const prevBtn = Button("prev", "Previous image");
  const printBtn = Button("print", "Print image");
  const nextBtn = Button("next", "Next image");
  const fullscreenBtn = Button("fullscreen", "Toggle fullscreen");
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
      role: "button",
    });
    return button;
  }

  const buttons = [
    closeBtn,
    prevBtn,
    printBtn,
    nextBtn,
    fullscreenBtn,
    flipVerticalBtn,
    flipHorizontalBtn,
    rotateLeftBtn,
    rotateRightBtn,
  ];

  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-labelledby", "lightbox-title");
  lightbox.setAttribute("aria-describedby", "lightbox-description");

  buttons.forEach((button) => {
    button.addEventListener("click", (event) => event.stopPropagation());
  });

  const SCALE_INCREMENT = 0.1;
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 3;

  const items = document.querySelectorAll(".item");
  let currentItem;

  let scale = 1;
  let isMoving = false;
  let mouseX, mouseY;
  let translateX = 0;
  let translateY = 0;
  let initialPinchDistance = 0;
  let initialScale = 1;

  function handleKeyDown(e) {
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
  }

  function handleMouseDown(e) {
    isMoving = true;
    mouseX = e.clientX;
    mouseY = e.clientY;
  }

  function handleMouseMove(e) {
    if (isMoving) {
      requestAnimationFrame(() => {
        translateX += e.clientX - mouseX;
        translateY += e.clientY - mouseY;
        mouseX = e.clientX;
        mouseY = e.clientY;
        transformImage();
      });
    }
  }

  function handleMouseUp() {
    isMoving = false;
  }

  function handleTouchStart(e) {
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
  }

  function handleTouchMove(e) {
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
  }

  function handleTouchEnd(e) {
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
  }

  function handleWheel(e) {
    e.preventDefault();
    if (e.deltaY < 0) {
      scale = Math.min(MAX_SCALE, scale + SCALE_INCREMENT);
    } else {
      scale = Math.max(MIN_SCALE, scale - SCALE_INCREMENT);
    }
    transformImage();
  }

  window.addEventListener("keydown", handleKeyDown);
  lightboxImage.addEventListener("mousedown", handleMouseDown);
  lightboxImage.addEventListener("mousemove", handleMouseMove);
  lightboxImage.addEventListener("mouseup", handleMouseUp);
  lightboxImage.addEventListener("touchstart", handleTouchStart);
  lightboxImage.addEventListener("touchmove", handleTouchMove);
  lightboxImage.addEventListener("touchend", handleTouchEnd);
  lightboxImage.addEventListener("wheel", handleWheel);

  async function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    });
  }

  async function handleItemClick(e, index) {
    e.preventDefault();
    currentItem = index;
    const highResSrc = e.target.closest("a").href;
    const thumbSrc = e.target.src;

    updateLightbox({
      src: thumbSrc,
      alt: e.target.alt,
      active: true,
      counter: `${currentItem + 1} / ${items.length}`,
    });

    updateTitleAndDescription(currentItem);

    gsap.fromTo(lightboxImage, { scale: 0 }, { scale: 1, duration: 1 });

    const highResImage = await loadImage(highResSrc);
    lightboxImage.src = highResImage.src;
  }

  items.forEach((item, index) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      handleItemClick(e, index).catch(console.error);
    });
  });

  function updateElementContent(elementId, content) {
    document.getElementById(elementId).textContent = content || "";
  }

  function updateTitleAndDescription(index) {
    const imgElement = items[index].querySelector("img");

    const titleId = imgElement?.getAttribute("aria-labelledby");
    updateElementContent(
      "lightbox-title",
      titleId && document.getElementById(titleId).textContent
    );

    const descriptionId = imgElement?.getAttribute("aria-describedby");
    updateElementContent(
      "lightbox-description",
      descriptionId && document.getElementById(descriptionId).textContent
    );

    lightbox.setAttribute("aria-labelledby", "lightbox-title");
    lightbox.setAttribute("aria-describedby", "lightbox-description");
  }

  function closeLightbox() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch((err) => {
        console.error(
          `Error attempting to exit full-screen mode: ${err.message} (${err.name})`
        );
      });
    }
    lightbox.style.display = "none";
    items[currentItem].focus();
  }

  function updateLightbox({ src, alt, active, counter }) {
    lightboxImage.src = src;
    lightboxImage.alt = alt;
    lightbox.classList.toggle("active", active);
    lightbox.style.display = active ? "flex" : "none";
    document.getElementById("image-counter").innerText = counter;
  }

  function changeImage(direction) {
    resetImageAndAnimation();
    currentItem = (currentItem + direction + items.length) % items.length;
    const newSrc = items[currentItem].querySelector("a").href;
    lightboxImage.src = newSrc;
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
      duration: 0,
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
      scale: scale,
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
      },
    });
  }

  let rotation = 0;
  let scaleX = 1;
  let scaleY = 1;

  prevBtn.addEventListener("click", () => animateImage(-1));
  nextBtn.addEventListener("click", () => animateImage(1));
  printBtn.addEventListener("click", printImage);
  buttons.push(printBtn);
  closeBtn.addEventListener("click", () => {
    gsap.to(lightboxImage, { scale: 0, duration: 1 });
    setTimeout(() => {
      closeLightbox();
      resetImageAndAnimation();
    }, 1000);
  });
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

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await lightbox.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error(
        `Error attempting to toggle full-screen mode: ${err.message} (${err.name})`
      );
    }
  }

  fullscreenBtn.addEventListener("click", () => {
    toggleFullscreen().catch((err) => console.error(err));
  });

  document.addEventListener("fullscreenchange", () => {
    const icon = fullscreenBtn.querySelector("i");
    const [addClass, removeClass] = document.fullscreenElement
      ? ["fa-compress", "fa-expand"]
      : ["fa-expand", "fa-compress"];

    icon.classList.remove(removeClass);
    icon.classList.add(addClass);
  });
}

const items = document.querySelectorAll(".item");

items.forEach((item) => {
  const img = item.querySelector("img");
  const caption = item.querySelector(".figure-caption");

  const timeline = gsap.timeline({ paused: true });

  timeline
    .to(img, {
      scale: 1.25,
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

function printImage() {
  const lightboxImage = document.getElementById("lightbox-image");

  if (!lightboxImage) {
    console.error("Lightbox image not found.");
    return;
  }

  const printWindow = window.open("", "_blank");
  const printDocument = printWindow.document;

  const printImageElement = printDocument.createElement("img");
  printImageElement.src = lightboxImage.src;
  printImageElement.style.maxWidth = "100%";
  printImageElement.style.maxHeight = "100%";

  printImageElement.addEventListener("load", function () {
    if (!printWindow.print()) {
      console.warn("Failed to trigger automatic printing.");
    }
    printWindow.close();
  });

  printImageElement.addEventListener("error", function () {
    console.error("Failed to load image for printing.");
    printWindow.close();
  });

  printDocument.body.appendChild(printImageElement);
}

function protectImages() {
  const images = document.getElementsByTagName("img");
  Array.from(images).forEach((img) => {
    img.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });
    img.addEventListener("dragstart", (event) => {
      event.preventDefault();
    });
  });
}

protectImages();

init();
