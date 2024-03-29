function init() {
  // STUB
  const grid = document.querySelector(".grid");
  if (grid === null) {
    console.error("Grid element not found");
    return;
  }

  const msnry = new Masonry(grid, {
    itemSelector: ".item",
    columnWidth: ".grid-sizer",
    percentPosition: true,
    horizontalOrder: true,
    initLayout: true,
    originLeft: false,
    originTop: true,
  });

  // STUB
  imagesLoaded(grid).on("progress", function () {
    msnry.layout();
  });

  //STUB
  const loadImageFromData = (img) => {
    const src = img.getAttribute("data-src");
    if (!src) {
      console.error("No data-src attribute found for image.");
      return;
    }
    img.src = src;
    img.removeAttribute("data-src");
  };

  // STUB
  const handleIntersection = (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      loadImageFromData(entry.target);
      observer.unobserve(entry.target);
    });
  };

  const setupImageObservationUsingIntersectionObserver = (images) => {
    const imgOptions = {
      rootMargin: "0px 0px 50px 0px",
      threshold: 0,
    };
    const imgObserver = new IntersectionObserver(
      handleIntersection,
      imgOptions
    );
    images.forEach((img) => imgObserver.observe(img));
  };

  const setupImageObservation = () => {
    const images = document.querySelectorAll("img[data-src]");
    if (images.length === 0) {
      console.warn("No images with data-src attribute found.");
      return;
    }

    if ("IntersectionObserver" in window) {
      setupImageObservationUsingIntersectionObserver(images);
    } else {
      images.forEach(loadImageFromData);
    }
  };

  const startLazyLoadImages = () => {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(setupImageObservation);
    } else {
      setupImageObservation();
    }
  };

  startLazyLoadImages();

  // STUB
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightbox-image");

  // STUB
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

  // STUB
  function setAttributes(element, attributes) {
    if (element && typeof attributes === "object") {
      for (const attribute in attributes) {
        element.setAttribute(attribute, attributes[attribute].toString());
      }
    }
  }

  // STUB
  function Button(id, ariaLabel) {
    const button = document.getElementById(id);
    if (!button) return;
    setAttributes(button, {
      "aria-label": ariaLabel,
      tabindex: 0,
      role: "button",
    });
    return button;
  }

  const buttonConfigs = [
    { id: "close", ariaLabel: "Close" },
    { id: "prev", ariaLabel: "Previous image" },
    { id: "print", ariaLabel: "Print image" },
    { id: "next", ariaLabel: "Next image" },
    { id: "fullscreen", ariaLabel: "Toggle fullscreen" },
    { id: "flip-vertical", ariaLabel: "Flip image vertically" },
    { id: "flip-horizontal", ariaLabel: "Flip image horizontally" },
    { id: "rotate-left", ariaLabel: "Rotate image to the left" },
    { id: "rotate-right", ariaLabel: "Rotate image to the right" },
  ];

  const buttons = buttonConfigs.map(({ id, ariaLabel }) =>
    Button(id, ariaLabel)
  );

  buttons.forEach((button) => {
    if (button) {
      button.addEventListener("click", (event) => event.stopPropagation());
    }
  });

  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-labelledby", "lightbox-title");
  lightbox.setAttribute("aria-describedby", "lightbox-description");

  // STUB
  const SCALE_INCREMENT = 0.1;
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 3;

  let scale = 1;
  let isMoving = false;
  let mouseX, mouseY;
  let translateX = 0,
    translateY = 0;
  let initialPinchDistance = 0;
  let initialScale = 1;

  let currentItem = 1;
  let rotation = 0;
  let scaleX = 1,
    scaleY = 1;
  let xPercent;

  // STUB
  function handleKeyActions(e) {
    if (lightbox.style.display === "none") return;

    const keysActionMap = {
      Escape: closeLightbox,
      ArrowLeft: () => changeImage(-1),
      a: () => changeImage(-1),
      A: () => changeImage(-1),
      ArrowRight: () => changeImage(1),
      d: () => changeImage(1),
      D: () => changeImage(1),
      "+": () => updateScale(SCALE_INCREMENT),
      "=": () => updateScale(SCALE_INCREMENT),
      "-": () => updateScale(-SCALE_INCREMENT),
      _: () => updateScale(-SCALE_INCREMENT),
      0: resetImageAndAnimation,
      r: () => {
        rotation += 90;
        gsap.to(lightboxImage, { rotation: rotation, duration: 1 });
      },
      R: () => {
        rotation -= 90;
        gsap.to(lightboxImage, { rotation: rotation, duration: 1 });
      },
      t: () => {
        rotation += 45;
        gsap.to(lightboxImage, { rotation: rotation, duration: 1 });
      },
      T: () => {
        rotation -= 45;
        gsap.to(lightboxImage, { rotation: rotation, duration: 1 });
      },
      f: () => {
        scaleX *= -1;
        gsap.to(lightboxImage, { scaleX: scaleX, duration: 1 });
      },
      F: () => {
        scaleY *= -1;
        gsap.to(lightboxImage, { scaleY: scaleY, duration: 1 });
      },
      p: printImage,
      P: printImage,
      F11: async () => {
        try {
          await toggleFullscreen();
        } catch (err) {
          console.error(`Error toggling fullscreen: ${err.message}`);
        }
      },
    };

    const action = keysActionMap[e.key];
    if (action) {
      action();
    }
  }

  // STUB
  function handleMouseDown(e) {
    isMoving = true;
    mouseX = e.clientX;
    mouseY = e.clientY;
  }

  // STUB
  function handleMouseMove(e) {
    if (!isMoving) return;
    requestAnimationFrame(() => {
      translateX += e.clientX - mouseX;
      translateY += e.clientY - mouseY;
      mouseX = e.clientX;
      mouseY = e.clientY;
      transformImage();
    });
  }

  // STUB
  function handleMouseUp() {
    isMoving = false;
  }

  // STUB
  function handleTouchStart(e) {
    if (e.touches.length === 1) {
      isMoving = true;
      mouseX = e.touches[0].clientX;
      mouseY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      isMoving = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
      initialScale = scale;
    }
  }

  // STUB
  function handleTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1 && isMoving) {
      const deltaX = e.touches[0].clientX - mouseX;
      const deltaY = e.touches[0].clientY - mouseY;
      translateX += deltaX;
      translateY += deltaY;
      mouseX = e.touches[0].clientX;
      mouseY = e.touches[0].clientY;
      transformImage();
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      scale = initialScale * (distance / initialPinchDistance);
      scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
      transformImage();
    }
  }

  // STUB
  function handleTouchEnd(e) {
    if (e.touches.length === 0) {
      isMoving = false;
    }
  }

  // STUB
  function handleWheel(e) {
    e.preventDefault();
    const increment = e.deltaY < 0 ? SCALE_INCREMENT : -SCALE_INCREMENT;
    scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale + increment));
    transformImage();
  }

  // STUB
  lightboxImage.addEventListener("mousedown", handleMouseDown);
  lightboxImage.addEventListener("mousemove", handleMouseMove);
  lightboxImage.addEventListener("mouseup", handleMouseUp);
  lightboxImage.addEventListener("touchstart", handleTouchStart);
  lightboxImage.addEventListener("touchmove", handleTouchMove);
  lightboxImage.addEventListener("touchend", handleTouchEnd);
  lightboxImage.addEventListener("wheel", handleWheel);
  self.addEventListener("keydown", handleKeyActions);

  // STUB
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    });
  }

  // STUB
  function setImageLink(linkElement) {
    const imageSrc = linkElement.getAttribute("data-src");

    loadImage(imageSrc)
      .then(() => {
        linkElement.href = imageSrc;
      })
      .catch((error) => {
        console.error(error.message);
      });
  }

  // STUB
  function setImageLinks() {
    const linkElements = document.querySelectorAll(".imageLink");

    for (const linkElement of linkElements) {
      setImageLink(linkElement);
    }
  }

  setImageLinks();

  // STUB
  async function openLightbox(e, index) {
    e.preventDefault();
    currentItem = index;
    const highResSrc = e.target.closest("a").href;

    updateLightbox({
      src: highResSrc,
      alt: e.target.alt,
      active: true,
      counter: `${currentItem + 1} / ${items.length}`,
    });

    updateTitleAndDescription(currentItem);
    syncThumbnail(currentItem + 1);

    gsap.fromTo(
      lightboxImage,
      { scale: 0, rotation: 20 },
      { scale: 1, rotation: 0, duration: 1.5, ease: "elastic.out(1, 0.3)" }
    );

    const highResImage = await loadImage(highResSrc);
    lightboxImage.src = highResImage.src;
  }

  // STUB
  function handleClick(e, index) {
    e.preventDefault();
    openLightbox(e, index).catch(console.error);
  }

  items.forEach((item, index) => {
    item.addEventListener("click", (e) => handleClick(e, index));
  });

  // STUB
  function updateTitleAndDescription(index) {
    const imgElement = items[index].querySelector("img");
    const title = document.getElementById("lightbox-title");
    const description = document.getElementById("lightbox-description");

    const titleId = imgElement?.getAttribute("aria-labelledby");
    const descriptionId = imgElement?.getAttribute("aria-describedby");

    title.textContent =
      (titleId && document.getElementById(titleId).textContent) || "";
    description.textContent =
      (descriptionId && document.getElementById(descriptionId).textContent) ||
      "";

    lightbox.setAttribute("aria-labelledby", "lightbox-title");
    lightbox.setAttribute("aria-describedby", "lightbox-description");
  }

  // STUB
  function changeImage(direction) {
    resetImageAndAnimation();

    currentItem = (currentItem + direction + items.length) % items.length;

    const newSrc = items[currentItem]?.querySelector("a")?.href;
    if (newSrc) {
      lightboxImage.src = newSrc;
    }

    updateTitleAndDescription(currentItem);
    syncThumbnail(currentItem + 1);

    const imageCounter = document.getElementById("image-counter");
    imageCounter.innerText = `${currentItem + 1} / ${items.length}`;

    xPercent = 100 * direction;

    gsap.to(lightboxImage, {
      xPercent,
      opacity: 0,
      duration: 1,
      onComplete: () => {
        gsap.fromTo(
          lightboxImage,
          { xPercent: -xPercent, opacity: 0 },
          { xPercent: 0, opacity: 1, duration: 1 }
        );
      },
    });
  }

  // STUB
  function updateLightbox({ src, alt, active, counter }) {
    lightboxImage.src = src;
    lightboxImage.alt = alt;
    lightbox.classList.toggle("active", active);
    lightbox.style.display = active ? "flex" : "none";
    document.getElementById("image-counter").innerText = counter;
  }

  // STUB
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

  // STUB
  const thumbnailContainer = document.getElementById("thumbnails");

  function handleThumbnailClick(e) {
    if (e.target.classList.contains("thumbnail")) {
      const index = parseInt(
        e.target.closest(".thumbnail-image").dataset.index,
        10
      );
      changeImage(index - currentItem);
      syncThumbnail(index);
    }
  }

  function syncThumbnail(index) {
    const thumbnails = document.querySelectorAll(".thumbnail-image");
    thumbnails.forEach((thumbContainer) => {
      const thumbIndexFromData = parseInt(thumbContainer.dataset.index, 10);
      const thumb = thumbContainer.querySelector(".thumbnail");
      if (thumbIndexFromData === index) {
        thumb.classList.add("active");
      } else {
        thumb.classList.remove("active");
      }
    });
  }

  thumbnailContainer.addEventListener("click", handleThumbnailClick);

  gsap.from(".thumbnail", {
    opacity: 0,
    y: -50,
    stagger: 0.1,
    duration: 1,
  });

  // STUB
  function transformImage() {
    gsap.set(lightboxImage, {
      x: translateX,
      y: translateY,
      scale: scale,
    });
  }

  // STUB
  prevBtn.addEventListener("click", () => {
    changeImage(-1);
  });

  nextBtn.addEventListener("click", () => {
    changeImage(1);
  });

  printBtn.addEventListener("click", printImage);
  buttons.push(printBtn);

  closeBtn.addEventListener("click", () => {
    gsap.to(lightboxImage, {
      scale: 0,
      rotation: -20,
      duration: 1.5,
      ease: "elastic.in(1, 0.3)",
    });
    setTimeout(() => {
      closeLightbox();
      resetImageAndAnimation();
    }, 1500);
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

  fullscreenBtn.addEventListener("click", () => {
    toggleFullscreen().catch((err) => {
      console.error(`Error toggling fullscreen: ${err.message}`);
    });
  });

  // STUB
  const icons = document.querySelectorAll(".lightbox .icon");

  icons.forEach((icon) => {
    let pulseAnimation;

    icon.addEventListener("mouseover", function () {
      pulseAnimation = gsap.to(this, {
        scale: 1.1,
        repeat: -1,
        yoyo: true,
        duration: 0.5,
        ease: "power1.inOut",
      });
    });

    icon.addEventListener("mouseout", function () {
      pulseAnimation.pause();
      gsap.to(this, {
        scale: 1,
        duration: 0.5,
        ease: "power1.inOut",
      });
    });
  });

  // STUB
  function resetImageAndAnimation() {
    gsap.set(lightboxImage, {
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      opacity: 1,
    });

    rotation = 0;
    scaleX = 1;
    scaleY = 1;
    scale = 1;
    translateX = 0;
    translateY = 0;
  }

  // STUB
  function preventCloseOnElements() {
    const elementsToPreventClose = [
      "lightbox-image",
      "image-counter",
      "lightbox-title",
      "lightbox-description",
      "thumbnails-container",
    ];

    elementsToPreventClose.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener("click", (event) => {
          event.stopPropagation();
        });
      }
    });
  }

  // STUB
  function closeOnOuterClick() {
    if (lightbox) {
      lightbox.addEventListener("click", () => {
        closeLightbox();
        resetImageAndAnimation();
      });
    }
  }

  preventCloseOnElements();
  closeOnOuterClick();

  // STUB
  function toggleFullscreen() {
    return document.fullscreenElement
      ? document.exitFullscreen()
      : lightbox.requestFullscreen();
  }

  document.addEventListener("fullscreenchange", () => {
    const icon = fullscreenBtn.querySelector("i");
    icon.classList.toggle("fa-expand", !document.fullscreenElement);
    icon.classList.toggle("fa-compress", !!document.fullscreenElement);
  });
}

// STUB
const items = Array.from(document.querySelectorAll(".item"));

const defaultConfig = {
  overlayDuration: 0.5,
  overlayEase: "power2.out",
  captionDuration: 0.5,
  captionEase: "power2.out",
};

const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

const getConfig = (item, attr, fallback) => item.getAttribute(attr) || fallback;

let colors = shuffle(
  Array.from({ length: 5 }, (_, i) =>
    getComputedStyle(document.documentElement)
      .getPropertyValue(`--grid-color-${i + 1}`)
      .trim()
  )
);

let colorIndex = 0;

items.forEach((item) => {
  if (colorIndex >= colors.length) {
    colors = shuffle(colors);
    colorIndex = 0;
  }

  const [overlay, caption] = ["overlay", "figure-caption"].map((cls) =>
    item.querySelector(`.${cls}`)
  );

  overlay.style.backgroundColor = colors[colorIndex++];

  const timeline = gsap.timeline({ paused: true, reversed: true });

  const animate = (el, props, duration, ease) =>
    timeline.to(el, { ...props, duration, ease }, 0);

  ["overlay", "caption"].forEach((type) => {
    const duration = getConfig(
      item,
      `data-${type}-duration`,
      defaultConfig[`${type}Duration`]
    );
    const ease = getConfig(
      item,
      `data-${type}-ease`,
      defaultConfig[`${type}Ease`]
    );
    animate(
      type === "overlay" ? overlay : caption,
      { autoAlpha: 0 },
      duration,
      ease
    );
  });

  const toggle = (play) => () => {
    timeline.timeScale(play ? 1 : -1);
    play ? timeline.play() : timeline.reverse();
  };

  item.addEventListener("mouseover", toggle(true));
  item.addEventListener("mouseout", toggle(false));
});

// STUB
function printImage() {
  const lightboxImage = document.getElementById("lightbox-image");

  if (!lightboxImage) {
    console.error("Lightbox image not found.");
    return;
  }

  const iframe = document.createElement("iframe");

  iframe.style.visibility = "hidden";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";

  document.body.appendChild(iframe);

  const iframeDocument =
    iframe.contentDocument || iframe.contentWindow.document;

  const printImageElement = iframeDocument.createElement("img");
  printImageElement.src = lightboxImage.src;
  printImageElement.style.maxWidth = "100%";
  printImageElement.style.maxHeight = "100%";

  iframeDocument.body.appendChild(printImageElement);

  printImageElement.addEventListener("load", function () {
    try {
      iframe.contentWindow.print();
    } catch (e) {
      console.warn("Failed to trigger automatic printing:", e);
    }
    document.body.removeChild(iframe);
  });

  printImageElement.addEventListener("error", function () {
    console.error("Failed to load image for printing.");
    document.body.removeChild(iframe);
  });
}

// STUB
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
