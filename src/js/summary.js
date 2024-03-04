const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('animatedText')) {
            entry.target.classList.add('animatedText');
        }
    })
});

document.querySelectorAll('li').forEach(element => {
    observer.observe(element);
})