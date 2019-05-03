const fs = require('fs');

function preprocess_ppm(data) {
    // remove comments, convert duplicated whitespace to one whitespace
    return data.split(/\r?\n/).map(
        line => {
            let s = line.indexOf("#");
            if (s >= 0)
                return line.substring(0, s);
            else
                return line;
        }).join(" ").replace(/\s+/g, " ");
}

// Assume P3
class PPMData {
    constructor(data) {
        let s = preprocess_ppm(data).split(" ");
        for (var i = 1; i < s.length; i++) {
            s[i] = parseInt(s[i]);
        }
        if (s.length >= 3) {
            this.type = s[0];
            this.width = s[1];
            this.height = s[2];
            this.ceil = s[3];
            this.pixels = s.slice(4);
        }
    }
    get isRenderable() {
        return (this.type === "P3" || this.type === "p3") && this.width >= 1 && this.height >= 1;
    }
    getColor(x, y) {
        if (!this.isRenderable)
            return null;
        let start = 3 * (this.width * y + x);
        let end = start + 2;
        if (end < this.pixels.length) {
            return {
                r: this.pixels[start],
                g: this.pixels[start + 1],
                b: this.pixels[start + 2]
            }
        } else {
            return null;
        }
    }
}

function render_ppm(canvas, data) {
    let ppm = new PPMData(data);
    if (ppm.isRenderable) {
        canvas.width = ppm.width;
        canvas.height = ppm.height;
        const ctx = canvas.getContext('2d');
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let rawData = imageData.data;
        var i = 0;
        for (var y = 0; y < canvas.height; y++) {
            for (var x = 0; x < canvas.width; x++) {
                let color = ppm.getColor(x, y);
                if (color !== null) {
                    rawData[i++] = color.r;
                    rawData[i++] = color.g;
                    rawData[i++] = color.b;
                    rawData[i++] = 255; // alpha
                } else {
                    rawData[i++] = 0;
                    rawData[i++] = 0;
                    rawData[i++] = 0;
                    rawData[i++] = 255; // alpha
                }
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }
}

let previous_path = null;
function start_watching(path) {
    if (previous_path !== null)
        fs.unwatchFile(previous_path);
    previous_path = path;

    render_path(path);
    fs.watchFile(path, {
        persistent: false
    }, (current, previous) => {
        render_path(path);
    });
}

function render_path(path) {
    return fs.readFile(path, "utf8", (err, data) => {
        if (err)
            throw err;
        render_ppm(document.getElementById("ppm-preview"), data);
    });
}

document.addEventListener("DOMContentLoaded", (event) => {
    let drag_and_drop_overlay = document.getElementById("drag-and-drop-overlay");
    drag_and_drop_overlay.ondragenter = (event) => {
        // Remove default drag and drop.
        event.preventDefault();
    };
    drag_and_drop_overlay.ondragend = (event) => {
        // Remove default drag and drop.
        event.preventDefault();
    };
    drag_and_drop_overlay.ondragover = (event) => {
        // Remove default drag and drop.
        event.preventDefault();
    };

    drag_and_drop_overlay.ondrop = (event) => {
        // Remove default drag and drop.
        event.preventDefault();
        start_watching(event.dataTransfer.files[0].path);
    };
});

