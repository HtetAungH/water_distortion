import React, { useEffect, useRef } from "react";
import GUI from "lil-gui";
import { vertexShaderSource, fragmentShaderSource } from "../shaders";

const WaterDistortion = () => {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const guiRef = useRef(null);
  const animationRef = useRef(null);

  // Refs to hold GL state to avoid re-renders
  const glRef = useRef(null);
  const uniformsRef = useRef(null);
  const imageRef = useRef(null);

  // Parameters
  const params = useRef({
    blueish: 0.6,
    scale: 7,
    illumination: 0.15,
    surfaceDistortion: 0.07,
    waterDistortion: 0.03,
    loadMyImage: () => {
      fileInputRef.current?.click();
    },
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // --- WebGL Setup ---
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      alert("WebGL is not supported by your browser.");
      return;
    }
    glRef.current = gl;

    // Shader Compilation Helpers
    const createShader = (gl, sourceCode, type) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, sourceCode);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error: " + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const createShaderProgram = (gl, vsSource, fsSource) => {
      const vertexShader = createShader(gl, vsSource, gl.VERTEX_SHADER);
      const fragmentShader = createShader(gl, fsSource, gl.FRAGMENT_SHADER);

      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Program link error: " + gl.getProgramInfoLog(program));
        return null;
      }
      return program;
    };

    const shaderProgram = createShaderProgram(
      gl,
      vertexShaderSource,
      fragmentShaderSource
    );
    gl.useProgram(shaderProgram);

    // Get Uniforms
    const getUniforms = (program) => {
      let uniforms = {};
      let uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < uniformCount; i++) {
        let uniformName = gl.getActiveUniform(program, i).name;
        uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
      }
      return uniforms;
    };
    uniformsRef.current = getUniforms(shaderProgram);

    // Buffer Setup
    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(shaderProgram, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // --- Helpers ---
    const updateUniforms = () => {
      if (!gl || !uniformsRef.current) return;
      gl.uniform1f(uniformsRef.current.u_blueish, params.current.blueish);
      gl.uniform1f(uniformsRef.current.u_scale, params.current.scale);
      gl.uniform1f(
        uniformsRef.current.u_illumination,
        params.current.illumination
      );
      gl.uniform1f(
        uniformsRef.current.u_surface_distortion,
        params.current.surfaceDistortion
      );
      gl.uniform1f(
        uniformsRef.current.u_water_distortion,
        params.current.waterDistortion
      );
    };

    const resizeCanvas = () => {
      if (!canvas || !imageRef.current || !uniformsRef.current) return;
      const devicePixelRatio = Math.min(window.devicePixelRatio, 2);
      const imgRatio =
        imageRef.current.naturalWidth / imageRef.current.naturalHeight;

      canvas.width = window.innerWidth * devicePixelRatio;
      canvas.height = window.innerHeight * devicePixelRatio;
      gl.viewport(0, 0, canvas.width, canvas.height);

      gl.uniform1f(uniformsRef.current.u_ratio, canvas.width / canvas.height);
      gl.uniform1f(uniformsRef.current.u_img_ratio, imgRatio);
    };

    const render = () => {
      const currentTime = performance.now();
      gl.uniform1f(uniformsRef.current.u_time, currentTime);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationRef.current = requestAnimationFrame(render);
    };

    const loadImage = (src) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src;
      img.onload = () => {
        imageRef.current = img;
        const imageTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, imageTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          img
        );
        gl.uniform1i(uniformsRef.current.u_image_texture, 0);

        resizeCanvas();
      };
    };

    // --- Initialization ---

    // 1. Initial Image
    updateUniforms();
    loadImage(
      "https://cdn.shopify.com/s/files/1/0185/5999/1872/files/hero--desktop.webp?v=1759340146"
    );

    // 2. Start Loop
    render();

    // 3. GUI Setup
    if (!guiRef.current) {
      const gui = new GUI();
      guiRef.current = gui;
      // Customize GUI Style via CSS in component or global, or let it be default
      // The original CSS hid it and styled it custom. Here we use default lil-gui style
      // but we can apply the class logic if strictly needed.

      gui.add(params.current, "loadMyImage").name("Load Image");
      const folder = gui.addFolder("Shader Params");
      folder.add(params.current, "blueish", 0, 0.8).onChange(updateUniforms);
      folder.add(params.current, "scale", 5, 12).onChange(updateUniforms);
      folder.add(params.current, "illumination", 0, 1).onChange(updateUniforms);
      folder
        .add(params.current, "surfaceDistortion", 0, 0.12)
        .name("Surface Distortion")
        .onChange(updateUniforms);
      folder
        .add(params.current, "waterDistortion", 0, 0.08)
        .name("Water Distortion")
        .onChange(updateUniforms);
    }

    // 4. Events
    window.addEventListener("resize", resizeCanvas);

    // --- Cleanup ---
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (guiRef.current) {
        guiRef.current.destroy();
        guiRef.current = null;
      }
      // Optional: detailed WebGL cleanup (delete buffers/textures) could go here
    };
  }, []); // Run once on mount

  // Handle File Input Change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        // We need to trigger the texture load inside the WebGL context
        // We can do this by reloading the image logic.
        // For simplicity, we can replicate the logic here or expose the internal loader.
        // Since logic is inside useEffect, let's just re-create the image object logic here
        // or trigger a re-render. Ideally, we just create a new image and bind texture.

        const gl = glRef.current;
        if (!gl) return;

        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          imageRef.current = img;
          const imageTexture = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, imageTexture);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            img
          );

          // Re-trigger resize to fix aspect ratio of new image
          //   const devicePixelRatio = Math.min(window.devicePixelRatio, 2);
          const imgRatio = img.naturalWidth / img.naturalHeight;
          const canvas = canvasRef.current;

          gl.uniform1f(uniformsRef.current.u_img_ratio, imgRatio);
          gl.uniform1f(
            uniformsRef.current.u_ratio,
            canvas.width / canvas.height
          );
        };
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 w-full h-full block"
      />
    </div>
  );
};

export default WaterDistortion;
