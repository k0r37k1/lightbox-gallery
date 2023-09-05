// ANCHOR Initialize Masonry Layout
function init() {
  // Select the grid element from DOM
  const grid = document.querySelector(".grid");
  if (grid === null) {
    console.error("Grid element not found");
    return;
  }

  // Create a new Masonry instance
  const msnry = new Masonry(grid, {
    itemSelector: ".item", // Define the class for grid items
    columnWidth: ".grid-sizer", // Define the class for column width
    percentPosition: true, // Use percentage-based dimensions
    horizontalOrder: true, // Maintain horizontal left-to-right order
    initLayout: true, // Initialize layout on creation
    originLeft: false, // Set the origin point on the right
    originTop: true, // Set the origin point at the top
  });

  // ANCHOR Image Load Listener
  imagesLoaded(grid).on("progress", function () {
    // Refresh Masonry layout
    msnry.layout();
  });

  // ANCHOR Lazy-Load Images
  function handleIntersection(entries, observer) {
    // Handle image intersection with viewport
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      loadImageFromData(entry.target);
      observer.unobserve(entry.target);
    });
  }

  function setupImageObservationUsingIntersectionObserver(images) {
    // Configure IntersectionObserver options
    const imgOptions = {
      rootMargin: "0px 0px 50px 0px",
      threshold: 0,
    };
    // Initialize IntersectionObserver
    const imgObserver = new IntersectionObserver(
      handleIntersection,
      imgOptions
    );
    // Observe each image
    images.forEach((img) => imgObserver.observe(img));
  }

  function setupImageObservation() {
    // Select images with data-src attribute
    const images = document.querySelectorAll("img[data-src]");
    if (!images.length) {
      console.warn("No images with data-src attribute found.");
      return;
    }
    // Use IntersectionObserver if available, else load images immediately
    "IntersectionObserver" in window
      ? setupImageObservationUsingIntersectionObserver(images)
      : images.forEach(loadImageFromData);
  }

  function startLazyLoadImages() {
    // Start image observation using requestIdleCallback if available
    "requestIdleCallback" in window
      ? requestIdleCallback(setupImageObservation)
      : setupImageObservation();
  }

  // Start the lazy-loading process
  startLazyLoadImages();

  // ANCHOR Load Image from Data-Attribute
  function loadImageFromData(img) {
    // Check for existence of data-src attribute
    if (!img.dataset.src) {
      console.error("No data-src attribute found for image.");
      return;
    }
    // Set image src from data-src and remove data-src
    img.src = img.dataset.src;
    img.removeAttribute("data-src");
  }

  // ANCHOR Setup Lightbox UI Elements
  const icons = document.querySelectorAll(".lightbox .icon"); // Select all lightbox icons
  const lightbox = document.getElementById("lightbox"); // Select the lightbox container
  const lightboxImage = document.getElementById("lightbox-image"); // Select the lightbox image

  // Create Buttons with Purpose Descriptions
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

  // ANCHOR Manage ARIA for Accessibility
  function setAttributes(element, attributes) {
    // Validate and set multiple attributes for an element
    if (element && typeof attributes === "object") {
      for (const attribute in attributes) {
        element.setAttribute(attribute, attributes[attribute].toString());
      }
    }
  }

  function setElementAriaLabel(selector, ariaLabel) {
    // Set ARIA labels for elements matching a selector
    const elements = document.querySelectorAll(selector);
    elements.forEach((element) => {
      setAttributes(element, { "aria-label": ariaLabel });
    });
  }

  // Assign ARIA labels to specific elements
  setElementAriaLabel("main", "Content Area");
  setElementAriaLabel("section#lightbox", "Gallery Lightbox");
  setElementAriaLabel("footer", "Footer Information");
  setElementAriaLabel("header", "Header and Navigation");
  setElementAriaLabel("nav", "Main Navigation");

  // ANCHOR Create and Configure Buttons with ARIA
  function Button(id, ariaLabel) {
    // Get button by ID and set ARIA attributes
    const button = document.getElementById(id);
    if (!button) return;
    setAttributes(button, {
      "aria-label": ariaLabel,
      tabindex: 0,
      role: "button",
    });
    return button;
  }

  // Button configurations with IDs and ARIA labels
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

  // Create buttons using configurations
  const buttons = buttonConfigs.map(({ id, ariaLabel }) =>
    Button(id, ariaLabel)
  );

  // Add click event to each button to stop propagation
  buttons.forEach((button) => {
    button.addEventListener("click", (event) => event.stopPropagation());
  });

  // Set ARIA attributes for lightbox
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-labelledby", "lightbox-title");
  lightbox.setAttribute("aria-describedby", "lightbox-description");

  // ANCHOR Manage Lightbox Interactions
  // Constants for scaling
  const SCALE_INCREMENT = 0.1; // Amount to scale per step
  const MIN_SCALE = 0.5; // Minimum scale factor
  const MAX_SCALE = 3; // Maximum scale factor

  // State variables
  let scale = 1; // Current scale factor
  let isMoving = false; // Flag for move operations
  let mouseX, mouseY; // Last mouse X, Y positions
  let translateX = 0,
    translateY = 0; // Current translate positions
  let initialPinchDistance = 0; // Initial distance between two fingers during pinch
  let initialScale = 1; // Initial scale before a pinch operation

  // Additional state for lightbox
  let currentItem = 0; // Current item index in lightbox
  let rotation = 0; // Current rotation angle
  let scaleX = 1,
    scaleY = 1; // Current scale factors for X and Y
  let xPercent; // To be used for percentage-based positioning

  // ANCHOR Handle Keyboard Interactions for Lightbox
  function handleKeyActions(e) {
    // Skip if lightbox is not displayed
    if (lightbox.style.display === "none") return;

    // Mapping keys to actions
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

    // Execute the corresponding action based on key press
    const action = keysActionMap[e.key];
    if (action) {
      action();
    }
  }

  // ANCHOR Update Image Scale and Position
  // Handle mouse down event for drag start
  function handleMouseDown(e) {
    isMoving = true;
    mouseX = e.clientX;
    mouseY = e.clientY;
  }

  // Handle mouse move event for dragging
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

  // Handle mouse up event for drag end
  function handleMouseUp() {
    isMoving = false;
  }

  // Handle touch start event
  function handleTouchStart(e) {
    // For single touch
    if (e.touches.length === 1) {
      isMoving = true;
      mouseX = e.touches[0].clientX;
      mouseY = e.touches[0].clientY;
    }
    // For pinch zoom
    else if (e.touches.length === 2) {
      isMoving = false;
      // Calculate initial pinch distance
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
      initialScale = scale;
    }
  }

  // Handle touch move event
  function handleTouchMove(e) {
    e.preventDefault();
    // For single touch move
    if (e.touches.length === 1 && isMoving) {
      const deltaX = e.touches[0].clientX - mouseX;
      const deltaY = e.touches[0].clientY - mouseY;
      translateX += deltaX;
      translateY += deltaY;
      mouseX = e.touches[0].clientX;
      mouseY = e.touches[0].clientY;
      transformImage();
      // For pinch zoom
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      scale = initialScale * (distance / initialPinchDistance);
      scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
      transformImage();
    }
  }

  // Handle touch end event
  function handleTouchEnd(e) {
    if (e.touches.length === 0) {
      isMoving = false;
    }
  }

  // Handle mouse wheel for zoom
  function handleWheel(e) {
    e.preventDefault();
    const increment = e.deltaY < 0 ? SCALE_INCREMENT : -SCALE_INCREMENT;
    scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale + increment));
    transformImage();
  }

  // Event listeners for mouse and touch actions
  lightboxImage.addEventListener("mousedown", handleMouseDown);
  lightboxImage.addEventListener("mousemove", handleMouseMove);
  lightboxImage.addEventListener("mouseup", handleMouseUp);
  lightboxImage.addEventListener("touchstart", handleTouchStart);
  lightboxImage.addEventListener("touchmove", handleTouchMove);
  lightboxImage.addEventListener("touchend", handleTouchEnd);
  lightboxImage.addEventListener("wheel", handleWheel);
  self.addEventListener("keydown", handleKeyActions);

  // ANCHOR Load Lightbox Image and Handle Errors
  // Function to asynchronously load an image and handle possible errors
  function loadImage(src) {
    // Create and return a Promise for image loading
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img); // On success, resolve Promise
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`)); // On failure, reject Promise
    });
  }

  // ANCHOR Update Links with Image URLs from data-src
  // Update a single anchor link with the image URL from its data-src attribute
  function setImageLink(linkElement) {
    const imageSrc = linkElement.getAttribute("data-src");

    // Load the image and update the href attribute
    loadImage(imageSrc)
      .then(() => {
        linkElement.href = imageSrc;
      })
      .catch((error) => {
        console.error(error.message);
      });
  }

  // Update all anchor links with their respective image URLs
  function setImageLinks() {
    const linkElements = document.querySelectorAll(".imageLink");

    // Loop through all link elements and update them
    for (const linkElement of linkElements) {
      setImageLink(linkElement);
    }
  }

  // Initialize the image links
  setImageLinks();

  // ANCHOR Manage Lightbox Open, Configuration, and Updates
  async function openLightbox(e, index) {
    e.preventDefault();
    currentItem = index;
    const highResSrc = e.target.closest("a").href;

    // Update the lightbox with the high-res image and other details
    updateLightbox({
      src: highResSrc,
      alt: e.target.alt,
      active: true,
      counter: `${currentItem + 1} / ${items.length}`,
    });

    // Update title and description
    updateTitleAndDescription(currentItem);

    // Initial animation for lightbox image
    gsap.fromTo(
      lightboxImage,
      { scale: 0, rotation: 20 },
      { scale: 1, rotation: 0, duration: 1.5, ease: "elastic.out(1, 0.3)" }
    );

    // Load high-resolution image and update lightbox
    const highResImage = await loadImage(highResSrc);
    lightboxImage.src = highResImage.src;
  }

  // Handle click event and open lightbox
  function handleClick(e, index) {
    e.preventDefault();
    openLightbox(e, index).catch(console.error);
  }

  // Attach click event listeners to each item
  items.forEach((item, index) => {
    item.addEventListener("click", (e) => handleClick(e, index));
  });

  // Update lightbox title and description based on ARIA attributes
  function updateTitleAndDescription(index) {
    const imgElement = items[index].querySelector("img");
    const title = document.getElementById("lightbox-title");
    const description = document.getElementById("lightbox-description");

    const titleId = imgElement?.getAttribute("aria-labelledby");
    const descriptionId = imgElement?.getAttribute("aria-describedby");

    // Update title and description using ARIA attributes
    title.textContent =
      (titleId && document.getElementById(titleId).textContent) || "";
    description.textContent =
      (descriptionId && document.getElementById(descriptionId).textContent) ||
      "";

    lightbox.setAttribute("aria-labelledby", "lightbox-title");
    lightbox.setAttribute("aria-describedby", "lightbox-description");
  }

  // ANCHOR Configure Lightbox Content and Visibility
  // Update the lightbox image, alt text, visibility, and counter
  function updateLightbox({ src, alt, active, counter }) {
    lightboxImage.src = src; // Update image source
    lightboxImage.alt = alt; // Update alt text
    lightbox.classList.toggle("active", active); // Toggle 'active' class
    lightbox.style.display = active ? "flex" : "none"; // Toggle visibility
    document.getElementById("image-counter").innerText = counter; // Update counter
  }

  // ANCHOR Change Lightbox Image and Animate
  function changeImage(direction) {
    // Reset image and animations
    resetImageAndAnimation();

    // Calculate new index for the item to display
    currentItem = (currentItem + direction + items.length) % items.length;

    // Update image source
    const newSrc = items[currentItem]?.querySelector("a")?.href;
    if (newSrc) {
      lightboxImage.src = newSrc;
    }

    // Update title and description
    updateTitleAndDescription(currentItem);

    // Update image counter display
    const imageCounter = document.getElementById("image-counter");
    imageCounter.innerText = `${currentItem + 1} / ${items.length}`;

    // Initial animation setup
    xPercent = 100 * direction;

    // Animate image change
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

  // ANCHOR Apply CSS Transforms to Lightbox Image
  function transformImage() {
    // Update image position and scale using GSAP
    gsap.set(lightboxImage, {
      x: translateX,
      y: translateY,
      scale: scale,
    });
  }

  // ANCHOR Close Lightbox and Exit Fullscreen
  function closeLightbox() {
    // Exit fullscreen mode if active
    if (document.fullscreenElement) {
      document.exitFullscreen().catch((err) => {
        console.error(
          `Error attempting to exit full-screen mode: ${err.message} (${err.name})`
        );
      });
    }

    // Hide the lightbox
    lightbox.style.display = "none";

    // Set focus back to the current item
    items[currentItem].focus();
  }

  // ANCHOR Event Listeners for Lightbox Controls
  // Navigate to the previous image
  prevBtn.addEventListener("click", () => {
    changeImage(-1);
  });

  // Navigate to the next image
  nextBtn.addEventListener("click", () => {
    changeImage(1);
  });

  // Print the current image
  printBtn.addEventListener("click", printImage);
  buttons.push(printBtn);

  // Close the lightbox with animation
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

  // Rotate the image 90 degrees to the right
  rotateRightBtn.addEventListener("click", () => {
    rotation += 90;
    gsap.to(lightboxImage, { rotation: rotation, duration: 1 });
  });

  // Rotate the image 90 degrees to the left
  rotateLeftBtn.addEventListener("click", () => {
    rotation -= 90;
    gsap.to(lightboxImage, { rotation: rotation, duration: 1 });
  });

  // Flip the image horizontally
  flipHorizontalBtn.addEventListener("click", () => {
    scaleX *= -1;
    gsap.to(lightboxImage, { scaleX: scaleX, duration: 1 });
  });

  // Flip the image vertically
  flipVerticalBtn.addEventListener("click", () => {
    scaleY *= -1;
    gsap.to(lightboxImage, { scaleY: scaleY, duration: 1 });
  });

  // Toggle fullscreen mode
  fullscreenBtn.addEventListener("click", () => {
    toggleFullscreen().catch((err) => {
      console.error(`Error toggling fullscreen: ${err.message}`);
    });
  });

  // ANCHOR Mouseover and Mouseout Animations for Icons
  // Iterate through each icon and add event listeners
  icons.forEach((icon) => {
    let pulseAnimation; // Variable to hold the GSAP animation instance

    // Add mouseover event for pulsing animation
    icon.addEventListener("mouseover", function () {
      pulseAnimation = gsap.to(this, {
        scale: 1.1, // Enlarge to 110% of original size
        repeat: -1, // Infinite repeat
        yoyo: true, // Reverse the animation on alternate repeats
        duration: 0.5, // Half-second duration for each pulse
        ease: "power1.inOut", // Easing type for smooth animation
      });
    });

    // Add mouseout event to pause pulsing and return to original size
    icon.addEventListener("mouseout", function () {
      pulseAnimation.pause(); // Pause the ongoing pulse animation
      gsap.to(this, {
        scale: 1, // Return to original size
        duration: 0.5, // Half-second duration for the scale-down
        ease: "power1.inOut", // Easing type for smooth animation
      });
    });
  });

  // ANCHOR Reset Lightbox and Animations
  function resetImageAndAnimation() {
    // Reset transformations using GSAP
    gsap.set(lightboxImage, {
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      opacity: 1,
    });

    // Reset variables
    rotation = 0;
    scaleX = 1;
    scaleY = 1;
    scale = 1;
    translateX = 0;
    translateY = 0;
  }

  // ANCHOR Lightbox Interactivity: Element-Specific Click Actions
  // Function to prevent closing the lightbox when clicking on specific elements
  function preventCloseOnElements() {
    const elementsToPreventClose = [
      "lightbox-image",
      "image-counter",
      "lightbox-title",
      "lightbox-description",
      "thumbnails-container",
    ]; // Add the IDs of elements where you want to prevent the lightbox from closing

    elementsToPreventClose.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener("click", (event) => {
          // Stop the click event from bubbling up to the lightbox container
          event.stopPropagation();
        });
      }
    });
  }

  // Function to close the lightbox when clicking anywhere else in the lightbox
  function closeOnOuterClick() {
    if (lightbox) {
      lightbox.addEventListener("click", () => {
        // Close the lightbox
        closeLightbox();
        // Reset the lightbox to its initial state
        resetImageAndAnimation();
      });
    }
  }

  // Execute the event listeners
  preventCloseOnElements();
  closeOnOuterClick();

  // ANCHOR Fullscreen Mode Toggle and Button Icon Update
  // Function to toggle fullscreen mode for the lightbox
  function toggleFullscreen() {
    return document.fullscreenElement
      ? document.exitFullscreen() // Exit fullscreen if already in fullscreen
      : lightbox.requestFullscreen(); // Enter fullscreen if not
  }

  // Listen for fullscreen changes to update the button icon
  document.addEventListener("fullscreenchange", () => {
    const icon = fullscreenBtn.querySelector("i"); // Get the icon element
    icon.classList.toggle("fa-expand", !document.fullscreenElement); // Use 'expand' icon if not in fullscreen
    icon.classList.toggle("fa-compress", !!document.fullscreenElement); // Use 'compress' icon if in fullscreen
  });
}

// ANCHOR Grid Items Configuration and Animation
// Shuffle and apply background colors to grid items while animating overlay and caption
const items = document.querySelectorAll(".item");

// Default animation configurations
const defaultConfig = {
  overlayDuration: 0.5,
  overlayEase: "power2.out",
  captionDuration: 0.5,
  captionEase: "power2.out",
};

// Shuffle an array
const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

// Get attribute value from item or fallback to default
const getConfig = (item, attr, fallback) => item.getAttribute(attr) || fallback;

// Shuffle and collect ten background colors from CSS variables
let colors = shuffle(
  Array.from({ length: 5 }, (_, i) =>
    getComputedStyle(document.documentElement)
      .getPropertyValue(`--grid-color-${i + 1}`)
      .trim()
  )
);

let colorIndex = 0;

// Assign background colors and setup animations for each grid item
items.forEach((item) => {
  if (colorIndex >= colors.length) {
    colors = shuffle(colors);
    colorIndex = 0;
  }

  // Get overlay and caption elements from each grid item
  const [overlay, caption] = ["overlay", "figure-caption"].map((cls) =>
    item.querySelector(`.${cls}`)
  );

  // Set the background color for the overlay
  overlay.style.backgroundColor = colors[colorIndex++];

  // Create a GSAP timeline for animations
  const timeline = gsap.timeline({ paused: true, reversed: true });

  // General function to set up animations
  const animate = (el, props, duration, ease) =>
    timeline.to(el, { ...props, duration, ease }, 0);

  // Configure and apply animations for both overlay and caption
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

  // Function to toggle animation play state
  const toggle = (play) => () => {
    timeline.timeScale(play ? 1 : -1);
    play ? timeline.play() : timeline.reverse();
  };

  // Add event listeners to trigger animations on mouseover and mouseout
  item.addEventListener("mouseover", toggle(true));
  item.addEventListener("mouseout", toggle(false));
});

// ANCHOR Print Lightbox Image
// Function to print the currently displayed lightbox image
function printImage() {
  // Retrieve the lightbox image element
  const lightboxImage = document.getElementById("lightbox-image");

  // Validate if the lightbox image is available
  if (!lightboxImage) {
    console.error("Lightbox image not found.");
    return;
  }

  // Create a new window for printing
  const printWindow = window.open("", "_blank");
  const printDocument = printWindow.document;

  // Create and configure the image element for printing
  const printImageElement = printDocument.createElement("img");
  printImageElement.src = lightboxImage.src;
  printImageElement.style.maxWidth = "100%";
  printImageElement.style.maxHeight = "100%";

  // Event listener to trigger print when image is loaded
  printImageElement.addEventListener("load", function () {
    if (!printWindow.print()) {
      console.warn("Failed to trigger automatic printing.");
    }
    printWindow.close();
  });

  // Event listener to handle image load failure
  printImageElement.addEventListener("error", function () {
    console.error("Failed to load image for printing.");
    printWindow.close();
  });

  // Append the image element to the new window and initiate print
  printDocument.body.appendChild(printImageElement);
}

// ANCHOR Protect Images
function protectImages() {
  // Retrieve all image elements on the page
  const images = document.getElementsByTagName("img");

  // Loop through each image element and attach event listeners
  Array.from(images).forEach((img) => {
    // Prevent right-click context menu on images
    img.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });

    // Prevent drag action on images
    img.addEventListener("dragstart", (event) => {
      event.preventDefault();
    });
  });
}

// Call the function to activate image protection
protectImages();

// Call the init function to initialize the Masonry grid layout
init();
