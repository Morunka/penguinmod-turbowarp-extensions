function disableContextMenu() {
    document.addEventListener('contextmenu', function(event) {
        event.preventDefault();
        return false;
    });
    
    document.addEventListener('DOMContentLoaded', function() {
        const elements = document.getElementsByTagName('*');
        
        for (let i = 0; i < elements.length; i++) {
            elements[i].addEventListener('contextmenu', function(event) {
                event.preventDefault();
                return false;
            });
        }
    });
}

window.addEventListener('load', disableContextMenu);

disableContextMenu();
