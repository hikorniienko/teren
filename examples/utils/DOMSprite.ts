export class DOMSprite {
    private hasParent = false;

    public x: number = 0;
    public y: number = 0;
    public rotation: number = 0;
    public text: string = '';

    constructor(
        public el: HTMLElement,
        public parent: HTMLElement,
    ) {
        el.style.position ||= 'absolute';
    }

    public render() {
        if (!this.hasParent) {
            this.parent.appendChild(this.el);
        }

        this.el.style.transform = `translate(${this.x}px, ${this.y}px) rotate(${this.rotation}deg)`;
        this.el.innerHTML = this.text;
    }
}
