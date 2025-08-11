export class CanvasSprite {
  public x = 0;
  public y = 0;
  public rotation = 0;
  public text = '';
  public size = 100;

  constructor(
    public ctx: CanvasRenderingContext2D,
    public canvas: HTMLCanvasElement,
    public color: string = '#0b66f9',
  ) {}

  public render() {
    this.ctx.save();
    this.ctx.translate(
      this.x + this.canvas.width / 2,
      this.y + this.canvas.height / 2,
    );
    this.ctx.rotate((this.rotation * Math.PI) / 180);
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = '20px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(this.text, 0, 0);

    this.ctx.restore();
  }
}
