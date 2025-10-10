document.getElementById('navToggle')?.addEventListener('click', function() {
  const navLinks = document.getElementById('navLinks');
  navLinks.style.display = navLinks.style.display === "flex" ? "none" : "flex";
});
