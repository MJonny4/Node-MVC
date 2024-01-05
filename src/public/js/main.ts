const backdrop = document.querySelector('.backdrop') as HTMLDivElement
const sideDrawer = document.querySelector('.mobile-nav') as HTMLDivElement
const menuToggle = document.querySelector('#side-menu-toggle') as HTMLButtonElement

function backdropClickHandler() {
    backdrop.style.display = 'none'
    sideDrawer.classList.remove('open')
}

function menuToggleClickHandler() {
    backdrop.style.display = 'block'
    sideDrawer.classList.add('open')
}

backdrop.addEventListener('click', backdropClickHandler)
menuToggle.addEventListener('click', menuToggleClickHandler)
