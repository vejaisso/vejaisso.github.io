document.querySelectorAll('.feito-checkbox').forEach((checkbox, index) => {
    const links = document.querySelectorAll('tr')[index + 1].querySelectorAll('a');
    if (!checkbox.checked) {
      links.forEach(link => {
        link.classList.add('disabled-link');
        link.removeAttribute('href');
      });
    }
  });
  