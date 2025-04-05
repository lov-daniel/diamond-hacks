// Listen for clicks on the page
document.addEventListener("click", (event) => {
    event.preventDefault(); // Optional: prevents navigation on <a> tags
    event.stopPropagation(); // Optional: prevent bubbling
  
    const clickedElement = event.target;
  
    // Example: Log info about the clicked element
    console.log("Clicked element:", clickedElement);
    console.log("Tag:", clickedElement.tagName);
    console.log("Text:", clickedElement.innerText);
    console.log("Class:", clickedElement.className);
  
    alert(`You clicked a <${clickedElement.tagName.toLowerCase()}> with text:\n"${clickedElement.innerText}"`);
  }, { once: true }); // 'once: true' makes sure it only triggers once

  document.addEventListener("mouseover", (e) => {
    e.target.style.outline = "2px solid red";
  });
  document.addEventListener("mouseout", (e) => {
    e.target.style.outline = "";
  });