import { useEffect, useRef } from "react";

interface WarpShaderProps {
    colors?: string[];
    speed?: number;
    distortion?: number;
    swirl?: number;
    className?: string;
    style?: React.CSSProperties;
}

// Helper to convert hex to RGB [0..1]
function hexToRgb(hex: string): [number, number, number] {
    let clean = hex.replace("#", "").trim();
    if (clean.length === 3) {
        clean = clean.split("").map((c) => c + c).join("");
    }
    const num = parseInt(clean, 16);
    if (isNaN(num)) return [0.05, 0.08, 0.15];
    return [
        ((num >> 16) & 255) / 255,
        ((num >> 8) & 255) / 255,
        (num & 255) / 255,
    ];
}

export function WarpShader({
    colors = ["#020409", "#0a122e", "#1c0b32", "#04262c"],
    speed = 0.8,
    distortion = 0.25,
    swirl = 0.8,
    className = "",
    style = {},
}: WarpShaderProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const colorsKey = colors.join(",");

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext("webgl", {
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
        });

        if (!gl) return;

        const vsSource = `
            attribute vec2 position;
            void main() {
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;

        const fsSource = `
            precision highp float;
            uniform vec2 u_resolution;
            uniform vec2 u_mouse;
            uniform float u_time;
            uniform vec3 u_c1;
            uniform vec3 u_c2;
            uniform vec3 u_c3;
            uniform vec3 u_c4;
            uniform float u_speed;
            uniform float u_dist;
            uniform float u_swirl;

            void main() {
                vec2 res = max(u_resolution.xy, vec2(1.0, 1.0));
                vec2 st = gl_FragCoord.xy / res;
                float aspect = res.x / res.y;
                vec2 p = st;
                p.x *= aspect;

                vec2 center = vec2(0.5 * aspect, 0.5);
                vec2 delta = p - center;
                float r = length(delta);

                // Smooth Continuous 3D Perspective Curvature (No sharp edge clamping)
                float z = 1.0 / (1.0 + r * r * 0.25);
                vec2 p3d = delta * (0.8 + 0.4 * z);

                float t = u_time * 0.35 * u_speed;

                // 3D Swirl with smooth depth iterations
                float theta = atan(p3d.y, p3d.x);
                for (int i = 1; i <= 8; i++) {
                    float fi = float(i);
                    theta += (u_swirl * 0.07) * sin(r * (fi * 1.4) - t * 0.7 + fi * 0.4);
                }
                vec2 warped = center + vec2(cos(theta), sin(theta)) * r;

                // 3D Domain Distortion
                warped.x += u_dist * sin(warped.y * 4.2 + t * 0.55);
                warped.y += u_dist * cos(warped.x * 4.2 + t * 0.45);

                // Shape = 'checks' (soft checks scale)
                vec2 checkCoord = warped * 8.5;
                float pattern = sin(checkCoord.x) * cos(checkCoord.y);
                float f = smoothstep(-0.25, 0.25, pattern);

                // 3D Lighting & Dynamic Specular Sheen tracking mouse coordinates
                vec3 normal = normalize(vec3(cos(checkCoord.x) * 0.35, sin(checkCoord.y) * 0.35, 1.0));
                
                vec2 mousePos = u_mouse * vec2(aspect, 1.0);
                vec2 lightDelta = mousePos - p;
                vec3 lightDir = normalize(vec3(lightDelta.x * 1.5 + 0.25, lightDelta.y * 1.5 + 0.4, 1.1));
                
                float diff = clamp(dot(normal, lightDir), 0.0, 1.0);
                float spec = pow(max(0.0, dot(reflect(-lightDir, normal), vec3(0.0, 0.0, 1.0))), 8.0) * 0.4;

                // Subtle spotlight aura following cursor
                float mouseDist = length(p - mousePos);
                float spotGlow = exp(-mouseDist * 2.0) * 0.22;

                // Cyber Web3 4-Color Gradient
                vec3 colA = mix(u_c1, u_c2, smoothstep(0.0, 0.55, f));
                vec3 colB = mix(u_c3, u_c4, smoothstep(0.35, 1.0, f));
                float mixVal = 0.5 + 0.5 * sin(warped.x * 2.2 + warped.y * 1.8 + t * 0.35);
                vec3 finalColor = mix(colA, colB, mixVal);

                // Apply 3D depth illumination + Dynamic Specular Sheen (Full-bleed edge-to-edge, no clipping)
                finalColor = finalColor * (0.65 + 0.35 * diff) + vec3(spec + spotGlow);

                // Correct GLSL smoothstep order (edge0 < edge1) for soft ambient vignette
                float vignette = 1.0 - smoothstep(0.6, 2.2, r);
                finalColor *= (0.4 + 0.6 * vignette);

                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;

        function createShader(type: number, source: string) {
            const shader = gl!.createShader(type);
            if (!shader) return null;
            gl!.shaderSource(shader, source);
            gl!.compileShader(shader);
            if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
                console.error(gl!.getShaderInfoLog(shader));
                gl!.deleteShader(shader);
                return null;
            }
            return shader;
        }

        const vs = createShader(gl.VERTEX_SHADER, vsSource);
        const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
        if (!vs || !fs) return;

        const program = gl.createProgram();
        if (!program) return;
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(program));
            return;
        }

        gl.useProgram(program);

        // Fullscreen quad
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                -1, -1,
                 1, -1,
                -1,  1,
                -1,  1,
                 1, -1,
                 1,  1,
            ]),
            gl.STATIC_DRAW
        );

        const posAttr = gl.getAttribLocation(program, "position");
        gl.enableVertexAttribArray(posAttr);
        gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

        const uRes = gl.getUniformLocation(program, "u_resolution");
        const uMouse = gl.getUniformLocation(program, "u_mouse");
        const uTime = gl.getUniformLocation(program, "u_time");
        const uC1 = gl.getUniformLocation(program, "u_c1");
        const uC2 = gl.getUniformLocation(program, "u_c2");
        const uC3 = gl.getUniformLocation(program, "u_c3");
        const uC4 = gl.getUniformLocation(program, "u_c4");
        const uSpeed = gl.getUniformLocation(program, "u_speed");
        const uDist = gl.getUniformLocation(program, "u_dist");
        const uSwirl = gl.getUniformLocation(program, "u_swirl");

        // Parse colors
        const c1 = hexToRgb(colors[0] || "#070a13");
        const c2 = hexToRgb(colors[1] || "#111a38");
        const c3 = hexToRgb(colors[2] || "#1f0f35");
        const c4 = hexToRgb(colors[3] || "#092f35");

        gl.uniform3f(uC1, c1[0], c1[1], c1[2]);
        gl.uniform3f(uC2, c2[0], c2[1], c2[2]);
        gl.uniform3f(uC3, c3[0], c3[1], c3[2]);
        gl.uniform3f(uC4, c4[0], c4[1], c4[2]);
        gl.uniform1f(uSpeed, speed);
        gl.uniform1f(uDist, distortion);
        gl.uniform1f(uSwirl, swirl);

        // Smooth Pointer/Mouse Tracking for Dynamic Specular Light
        const targetMouse = { x: 0.5, y: 0.5 };
        const currMouse = { x: 0.5, y: 0.5 };

        const handlePointerMove = (e: PointerEvent) => {
            targetMouse.x = e.clientX / window.innerWidth;
            targetMouse.y = 1.0 - (e.clientY / window.innerHeight);
        };
        window.addEventListener("pointermove", handlePointerMove, { passive: true });

        // Update canvas sizing and uniform resolution
        const updateSize = (force = false) => {
            const rect = canvas.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            const w = Math.max(Math.floor((rect.width || window.innerWidth) * dpr), 1);
            const h = Math.max(Math.floor((rect.height || window.innerHeight) * dpr), 1);
            if (force || canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
                gl.viewport(0, 0, w, h);
                gl.uniform2f(uRes, w, h);
            }
        };

        // CRITICAL: Force initial viewport and resolution immediately so shader starts rendering on frame 1
        updateSize(true);

        const handleResize = () => updateSize(true);
        window.addEventListener("resize", handleResize, { passive: true });

        let animationFrameId: number;
        let startTime = performance.now();

        const render = () => {
            updateSize(false);
            const elapsed = (performance.now() - startTime) / 1000;
            gl.uniform1f(uTime, elapsed);

            // Interpolate mouse coordinates (critically damped 0.08)
            currMouse.x += (targetMouse.x - currMouse.x) * 0.08;
            currMouse.y += (targetMouse.y - currMouse.y) * 0.08;
            if (uMouse) {
                gl.uniform2f(uMouse, currMouse.x, currMouse.y);
            }

            gl.drawArrays(gl.TRIANGLES, 0, 6);
            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("resize", handleResize);
            cancelAnimationFrame(animationFrameId);
            if (program) {
                gl.deleteProgram(program);
            }
            if (vs) gl.deleteShader(vs);
            if (fs) gl.deleteShader(fs);
            if (positionBuffer) gl.deleteBuffer(positionBuffer);
        };
    }, [colorsKey, speed, distortion, swirl]);

    return (
        <canvas
            ref={canvasRef}
            className={`w-full h-full block ${className}`}
            style={{ width: "100%", height: "100%", ...style }}
        />
    );
}
