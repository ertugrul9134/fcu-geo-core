import { coordinates, measurements } from './data.js';

class SurveyEngine {
    static GON_TO_RAD = Math.PI / 200.0;
    static RAD_TO_GON = 200.0 / Math.PI;

    static normalizeGon(angle) {
        while (angle < 0) angle += 400.0;
        while (angle >= 400.0) angle -= 400.0;
        return angle;
    }

    static firstFundamental(ya, xa, azimuth, distance) {
        const azRad = azimuth * this.GON_TO_RAD;
        const dy = distance * Math.sin(azRad);
        const dx = distance * Math.cos(azRad);
        return { y: ya + dy, x: xa + dx };
    }

    static secondFundamental(ya, xa, yb, xb) {
        const dy = yb - ya;
        const dx = xb - xa;
        const distance = Math.sqrt(dy ** 2 + dx ** 2);
        
        if (distance === 0) return { azimuth: 0, distance: 0 };
        
        const alpha = dx !== 0 ? Math.abs(Math.atan(Math.abs(dy / dx)) * this.RAD_TO_GON) : 100.0;
        
        let azimuth = 0;
        if (dy >= 0 && dx >= 0) azimuth = alpha;           // Q1
        else if (dy >= 0 && dx < 0) azimuth = 200.0 - alpha; // Q2
        else if (dy < 0 && dx < 0) azimuth = 200.0 + alpha;  // Q3
        else if (dy < 0 && dx >= 0) azimuth = 400.0 - alpha; // Q4
        
        return { azimuth: this.normalizeGon(azimuth), distance };
    }

    static getMeasuredDirection(fromNode, toNode) {
        const m = measurements.find(m => m.dn == fromNode && m.bn == toNode);
        return m ? m.dir : null;
    }

    static getMeasuredDistance(fromNode, toNode) {
        const m = measurements.find(m => m.dn == fromNode && m.bn == toNode);
        return m ? m.dist : null;
    }
}

class App {
    constructor() {
        this.canvas = document.getElementById('geoCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.tooltip = document.getElementById('tooltip');
        this.selectedNodesList = document.getElementById('selectedNodesList');
        this.calculateBtn = document.getElementById('calculateBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.resultsContent = document.getElementById('resultsContent');
        
        this.nodes = Object.keys(coordinates).map(Number);
        this.selectedNodes = [];
        this.hoveredNode = null;
        
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;

        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        
        this.calculateBtn.addEventListener('click', () => this.executeProtocol());
        this.clearBtn.addEventListener('click', () => this.clearSelection());

        this.computeTransform();
        this.draw();
    }

    resizeCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.computeTransform();
        this.draw();
    }

    computeTransform() {
        if (this.nodes.length === 0) return;
        
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (let id of this.nodes) {
            const { Y, X } = coordinates[id];
            if (Y < minY) minY = Y;
            if (Y > maxY) maxY = Y;
            if (X < minX) minX = X;
            if (X > maxX) maxX = X;
        }

        const padding = 50;
        const width = maxY - minY;
        const height = maxX - minX;

        const scaleX = (this.canvas.width - padding * 2) / width;
        const scaleY = (this.canvas.height - padding * 2) / height;
        this.scale = Math.min(scaleX, scaleY);

        this.offsetX = (this.canvas.width - width * this.scale) / 2 - minY * this.scale;
        this.offsetY = (this.canvas.height - height * this.scale) / 2 - minX * this.scale;
    }

    toScreen(y, x) {
        // Map geodetic Y (Easting) to screen X, and X (Northing) to screen Y (inverted)
        const sx = y * this.scale + this.offsetX;
        const sy = this.canvas.height - (x * this.scale + this.offsetY);
        return { sx, sy };
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw connections
        this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const p1 = coordinates[this.nodes[i]];
                const p2 = coordinates[this.nodes[j]];
                const s1 = this.toScreen(p1.Y, p1.X);
                const s2 = this.toScreen(p2.Y, p2.X);
                this.ctx.beginPath();
                this.ctx.moveTo(s1.sx, s1.sy);
                this.ctx.lineTo(s2.sx, s2.sy);
                this.ctx.stroke();
            }
        }

        // Draw selection polygon
        if (this.selectedNodes.length > 1) {
            this.ctx.strokeStyle = '#00f0ff';
            this.ctx.fillStyle = 'rgba(0, 240, 255, 0.1)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            for (let i = 0; i < this.selectedNodes.length; i++) {
                const p = coordinates[this.selectedNodes[i]];
                const s = this.toScreen(p.Y, p.X);
                if (i === 0) this.ctx.moveTo(s.sx, s.sy);
                else this.ctx.lineTo(s.sx, s.sy);
            }
            if (this.selectedNodes.length === 3) {
                this.ctx.closePath();
                this.ctx.fill();
            }
            this.ctx.stroke();
        }

        // Draw nodes
        for (let id of this.nodes) {
            const { Y, X } = coordinates[id];
            const { sx, sy } = this.toScreen(Y, X);
            
            const isSelected = this.selectedNodes.includes(id);
            const isHovered = this.hoveredNode === id;

            this.ctx.beginPath();
            this.ctx.arc(sx, sy, isSelected || isHovered ? 8 : 5, 0, Math.PI * 2);
            this.ctx.fillStyle = isSelected ? '#ff3366' : (isHovered ? '#00f0ff' : '#8892b0');
            this.ctx.fill();
            
            if (isSelected) {
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }

            // Draw labels
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px JetBrains Mono';
            this.ctx.fillText(id.toString(), sx + 10, sy - 10);
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        this.hoveredNode = null;
        for (let id of this.nodes) {
            const { Y, X } = coordinates[id];
            const { sx, sy } = this.toScreen(Y, X);
            const dist = Math.sqrt((mx - sx)**2 + (my - sy)**2);
            
            if (dist < 15) {
                this.hoveredNode = id;
                break;
            }
        }

        if (this.hoveredNode) {
            this.canvas.style.cursor = 'pointer';
            this.tooltip.classList.remove('hidden');
            this.tooltip.style.left = (e.clientX + 15) + 'px';
            this.tooltip.style.top = (e.clientY + 15) + 'px';
            const c = coordinates[this.hoveredNode];
            this.tooltip.innerHTML = `Node: ${this.hoveredNode}<br>Y: ${c.Y.toFixed(3)}<br>X: ${c.X.toFixed(3)}`;
        } else {
            this.canvas.style.cursor = 'crosshair';
            this.tooltip.classList.add('hidden');
        }

        this.draw();
    }

    handleClick(e) {
        if (this.hoveredNode) {
            if (this.selectedNodes.includes(this.hoveredNode)) {
                this.selectedNodes = this.selectedNodes.filter(id => id !== this.hoveredNode);
            } else if (this.selectedNodes.length < 3) {
                this.selectedNodes.push(this.hoveredNode);
            }
            this.updateUI();
            this.draw();
        }
    }

    clearSelection() {
        this.selectedNodes = [];
        this.updateUI();
        this.draw();
        this.resultsContent.innerHTML = '<span class="empty-state">Awaiting execution...</span>';
    }

    updateUI() {
        if (this.selectedNodes.length === 0) {
            this.selectedNodesList.innerHTML = '<span class="empty-state">Awaiting selection...</span>';
        } else {
            this.selectedNodesList.innerHTML = this.selectedNodes.map(id => `<span class="node-badge">${id}</span>`).join('');
        }
        
        this.calculateBtn.disabled = this.selectedNodes.length !== 3;
    }

    executeProtocol() {
        if (this.selectedNodes.length !== 3) return;

        const [p1, p2, p3] = this.selectedNodes;
        
        let html = '';

        // 1. Check if we have measured directions to calculate internal angles
        html += `<div class="result-block"><strong>[1] Angular Extraction & Error Distribution</strong><br>`;
        
        const calcAngle = (center, left, right) => {
            const dirLeft = SurveyEngine.getMeasuredDirection(center, left);
            const dirRight = SurveyEngine.getMeasuredDirection(center, right);
            if (dirLeft === null || dirRight === null) return null;
            let angle = dirRight - dirLeft;
            if (angle < 0) angle += 400;
            return angle;
        };

        // Try permutations to find valid angles
        let angles = {};
        
        // At p1, angle between p2 and p3 (p3 is right of p2, or vice versa? Just get absolute diff)
        const getAbsAngle = (center, n1, n2) => {
            const d1 = SurveyEngine.getMeasuredDirection(center, n1);
            const d2 = SurveyEngine.getMeasuredDirection(center, n2);
            if (d1 === null || d2 === null) return null;
            let diff = Math.abs(d1 - d2);
            if (diff > 200) diff = 400 - diff; // Internal angle is usually < 200
            return diff;
        };

        angles[p1] = getAbsAngle(p1, p2, p3);
        angles[p2] = getAbsAngle(p2, p1, p3);
        angles[p3] = getAbsAngle(p3, p1, p2);

        if (angles[p1] === null || angles[p2] === null || angles[p3] === null) {
            html += `<span class="error-text">ERR: Insufficient raw direction telemetry in database for triangle ${p1}-${p2}-${p3}. Cannot compute experimental internal angles.</span></div>`;
            
            // Fallback: Calculate from theoretical coordinates
            html += `<div class="result-block"><span>FALLBACK: Computing theoretical angles from coordinate database.</span><br>`;
            
            const c1 = coordinates[p1];
            const c2 = coordinates[p2];
            const c3 = coordinates[p3];
            
            const az12 = SurveyEngine.secondFundamental(c1.Y, c1.X, c2.Y, c2.X).azimuth;
            const az13 = SurveyEngine.secondFundamental(c1.Y, c1.X, c3.Y, c3.X).azimuth;
            angles[p1] = Math.abs(az13 - az12);
            if(angles[p1]>200) angles[p1] = 400-angles[p1];
            
            const az21 = SurveyEngine.secondFundamental(c2.Y, c2.X, c1.Y, c1.X).azimuth;
            const az23 = SurveyEngine.secondFundamental(c2.Y, c2.X, c3.Y, c3.X).azimuth;
            angles[p2] = Math.abs(az23 - az21);
            if(angles[p2]>200) angles[p2] = 400-angles[p2];
            
            const az31 = SurveyEngine.secondFundamental(c3.Y, c3.X, c1.Y, c1.X).azimuth;
            const az32 = SurveyEngine.secondFundamental(c3.Y, c3.X, c2.Y, c2.X).azimuth;
            angles[p3] = Math.abs(az32 - az31);
            if(angles[p3]>200) angles[p3] = 400-angles[p3];
            
            html += `Theoretical Angles:<br>`;
            html += `&beta;<sub>${p1}</sub> = <span class="highlight">${angles[p1].toFixed(4)}<sup>g</sup></span><br>`;
            html += `&beta;<sub>${p2}</sub> = <span class="highlight">${angles[p2].toFixed(4)}<sup>g</sup></span><br>`;
            html += `&beta;<sub>${p3}</sub> = <span class="highlight">${angles[p3].toFixed(4)}<sup>g</sup></span><br>`;
            html += `Sum = ${(angles[p1]+angles[p2]+angles[p3]).toFixed(4)}<sup>g</sup><br></div>`;

            this.resultsContent.innerHTML = html;
            return;
        }

        html += `Raw Internal Angles:<br>`;
        html += `&beta;<sub>${p1}</sub> = <span class="highlight">${angles[p1].toFixed(4)}<sup>g</sup></span><br>`;
        html += `&beta;<sub>${p2}</sub> = <span class="highlight">${angles[p2].toFixed(4)}<sup>g</sup></span><br>`;
        html += `&beta;<sub>${p3}</sub> = <span class="highlight">${angles[p3].toFixed(4)}<sup>g</sup></span><br>`;

        const sum = angles[p1] + angles[p2] + angles[p3];
        const error = 200.0 - sum;
        html += `Sum = ${sum.toFixed(4)}<sup>g</sup><br>`;
        html += `Kapanma Hatası (w) = 200 - Sum = <span class="${Math.abs(error) > 0.1 ? 'error-text' : 'highlight'}">${error.toFixed(4)}<sup>g</sup></span><br>`;

        const correction = error / 3;
        angles[p1] += correction;
        angles[p2] += correction;
        angles[p3] += correction;

        html += `<br>Kesin Açılar (Adjusted):<br>`;
        html += `&beta;<sub>${p1}</sub> = ${angles[p1].toFixed(4)}<sup>g</sup><br>`;
        html += `&beta;<sub>${p2}</sub> = ${angles[p2].toFixed(4)}<sup>g</sup><br>`;
        html += `&beta;<sub>${p3}</sub> = ${angles[p3].toFixed(4)}<sup>g</sup><br></div>`;

        // 2. Sine Theorem (Kenar Hesabı)
        html += `<div class="result-block"><strong>[2] Sine Theorem Optimization (Kenar Hesabı)</strong><br>`;
        // Find a measured distance
        let dist12 = SurveyEngine.getMeasuredDistance(p1, p2) || SurveyEngine.getMeasuredDistance(p2, p1);
        let dist23 = SurveyEngine.getMeasuredDistance(p2, p3) || SurveyEngine.getMeasuredDistance(p3, p2);
        let dist31 = SurveyEngine.getMeasuredDistance(p3, p1) || SurveyEngine.getMeasuredDistance(p1, p3);

        let knownDist, knownOppositeAngle, pStart, pEnd, pOpposite;
        if (dist12) { knownDist = dist12; knownOppositeAngle = angles[p3]; pStart=p1; pEnd=p2; pOpposite=p3; }
        else if (dist23) { knownDist = dist23; knownOppositeAngle = angles[p1]; pStart=p2; pEnd=p3; pOpposite=p1;}
        else if (dist31) { knownDist = dist31; knownOppositeAngle = angles[p2]; pStart=p3; pEnd=p1; pOpposite=p2;}

        if (!knownDist) {
            html += `<span class="error-text">ERR: No distance telemetry available for edges of this triangle.</span></div>`;
        } else {
            html += `Base Edge ${pStart}-${pEnd}: ${knownDist.toFixed(3)}m<br>`;
            
            const sineRatio = knownDist / Math.sin(knownOppositeAngle * SurveyEngine.GON_TO_RAD);
            
            const calcDist23 = pStart===p2 && pEnd===p3 ? dist23 : sineRatio * Math.sin(angles[p1] * SurveyEngine.GON_TO_RAD);
            const calcDist31 = pStart===p3 && pEnd===p1 ? dist31 : sineRatio * Math.sin(angles[p2] * SurveyEngine.GON_TO_RAD);
            const calcDist12 = pStart===p1 && pEnd===p2 ? dist12 : sineRatio * Math.sin(angles[p3] * SurveyEngine.GON_TO_RAD);

            html += `Calculated Edges:<br>`;
            html += `S<sub>${p1}-${p2}</sub> = <span class="highlight">${calcDist12.toFixed(3)}m</span><br>`;
            html += `S<sub>${p2}-${p3}</sub> = <span class="highlight">${calcDist23.toFixed(3)}m</span><br>`;
            html += `S<sub>${p3}-${p1}</sub> = <span class="highlight">${calcDist31.toFixed(3)}m</span><br></div>`;

            // 3. Coordinate Calculation
            html += `<div class="result-block"><strong>[3] 1. Temel Ödev Coordinate Projection</strong><br>`;
            
            // Assume p1 and p2 coordinates are known, calculate p3
            const c1 = coordinates[p1];
            const c2 = coordinates[p2];
            
            const baseAzimuth = SurveyEngine.secondFundamental(c1.Y, c1.X, c2.Y, c2.X).azimuth;
            
            // Azimuth to p3 from p1
            // Requires checking orientation (left or right)
            // We just use the known database coordinates to find if it's + or -
            const az13_true = SurveyEngine.secondFundamental(c1.Y, c1.X, coordinates[p3].Y, coordinates[p3].X).azimuth;
            let az13 = baseAzimuth + angles[p1];
            if (Math.abs(az13_true - az13) > 100) az13 = baseAzimuth - angles[p1]; // adjust direction
            az13 = SurveyEngine.normalizeGon(az13);

            const p3_calc1 = SurveyEngine.firstFundamental(c1.Y, c1.X, az13, calcDist31);
            
            html += `Projecting Node ${p3} from Node ${p1}:<br>`;
            html += `Y = ${p3_calc1.y.toFixed(3)}, X = ${p3_calc1.x.toFixed(3)}<br><br>`;

            html += `Database Truth Node ${p3}:<br>`;
            html += `Y = ${coordinates[p3].Y.toFixed(3)}, X = ${coordinates[p3].X.toFixed(3)}<br>`;
            
            const diffY = Math.abs(p3_calc1.y - coordinates[p3].Y);
            const diffX = Math.abs(p3_calc1.x - coordinates[p3].X);
            html += `Deviation: &Delta;Y = <span class="${diffY > 0.05 ? 'error-text':'highlight'}">${diffY.toFixed(3)}m</span>, &Delta;X = <span class="${diffX > 0.05 ? 'error-text':'highlight'}">${diffX.toFixed(3)}m</span></div>`;
        }

        this.resultsContent.innerHTML = html;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});
