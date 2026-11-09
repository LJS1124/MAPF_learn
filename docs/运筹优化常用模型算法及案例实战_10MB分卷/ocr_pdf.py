"""Add an invisible RapidOCR text layer to an image-only PDF. Usage: ocr_pdf.py in.pdf out.pdf out.txt"""
import sys, pymupdf
from rapidocr import RapidOCR

FONT = "china-s"

def main(src, dst, txt_path):
    eng = RapidOCR()
    doc = pymupdf.open(src)
    texts = []
    for pno, page in enumerate(doc):
        xref = page.get_images()[0][0]
        pix = pymupdf.Pixmap(doc, xref)
        if pix.n - pix.alpha > 3 or pix.colorspace is None or pix.colorspace.n != 3:
            pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
        img_rect = page.get_image_rects(xref)[0]
        sx, sy = img_rect.width / pix.width, img_rect.height / pix.height
        r = eng(pix.tobytes("png"))
        lines = []
        if r.boxes is not None:
            for box, t in zip(r.boxes, r.txts):
                t = t.strip()
                if not t:
                    continue
                xs = [float(p[0]) for p in box]; ys = [float(p[1]) for p in box]
                x0 = img_rect.x0 + min(xs) * sx; x1 = img_rect.x0 + max(xs) * sx
                y0 = img_rect.y0 + min(ys) * sy; y1 = img_rect.y0 + max(ys) * sy
                h = y1 - y0
                fs = max(h * 0.85, 1)
                w_at = pymupdf.get_text_length(t, fontname=FONT, fontsize=fs)
                scale = (x1 - x0) / w_at if w_at > 0 else 1
                base = pymupdf.Point(x0, y1 - h * 0.18)
                page.insert_text(base, t, fontsize=fs, fontname=FONT, render_mode=3,
                                 morph=(base, pymupdf.Matrix(scale, 1)))
                lines.append(t)
        texts.append(f"\f[第 {pno+1} 页 / 本分卷]\n" + "\n".join(lines))
        print(f"{src.split('/')[-1]} page {pno+1}/{len(doc)}", flush=True)
    doc.save(dst, garbage=3, deflate=True)
    open(txt_path, "w").write("\n".join(texts))

if __name__ == "__main__":
    main(*sys.argv[1:4])
