document.addEventListener('DOMContentLoaded', () => {
    // Stub Logic for Login Button
    const loginBtns = document.querySelectorAll('.login-btn-trigger');
    const stubPage = document.getElementById('stub-page');
    const stubClose = document.getElementById('stub-close');

    if (stubPage && stubClose) {
        loginBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                stubPage.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        });

        stubClose.addEventListener('click', () => {
            stubPage.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // Reveal Logic
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                entry.target.classList.add('active'); // Support both classes
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
});
