// WebGL renderer for the black hole: one full-screen pass (lensed sky, shadow, photon ring,
// accretion disk) and one sprite batch (clutter, captured noodles, sparks, flash).
// Why WebGL: the lensing bends every background pixel around the hole each frame, which
// Canvas 2D cannot do at 60 fps. Plain WebGL 1, hand-written, no dependencies.

const HOLE_VS = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`

const HOLE_FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D u_bg;
uniform vec2 u_res;   // device px
uniform vec2 u_hole;  // device px, y up
uniform float u_R;    // shadow radius, device px
uniform float u_t;    // disk phase
uniform float u_on;   // presence 0..1
uniform float u_heat; // feeding 0..1
uniform float u_px;   // one device px in R units
uniform vec2 u_wave;  // gravitational wave after a clear: radius (device px), amplitude 0..1
uniform float u_dpr;

float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vn(vec2 p,float per){
  vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  float a=hash(vec2(mod(i.x,per),i.y)),b=hash(vec2(mod(i.x+1.,per),i.y));
  float c=hash(vec2(mod(i.x,per),i.y+1.)),d=hash(vec2(mod(i.x+1.,per),i.y+1.));
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}
const float RIN=1.5;
const float ROUT=3.9;
const float TAU=6.2831853;
// disk emission at disk-plane radius r (R units) and angle a; returns intensity (not colour)
float disk(float r,float a){
  if(r<RIN*0.9||r>ROUT)return 0.;
  float prof=smoothstep(RIN*0.94,RIN*1.12,r)*(1.-smoothstep(ROUT*0.45,ROUT,r))*pow(RIN/r,1.5);
  float w=a+u_t*2.2*pow(r,-1.5);
  float x=fract(w/TAU)*28.;
  float n=vn(vec2(x,r*2.6),28.)*.62+vn(vec2(x*2.+7.,r*6.5),56.)*.38;
  float streak=.35+1.05*n*n;
  // relativistic beaming: the side moving toward us (left) is brighter
  float mu=-cos(a)*.95;
  float D=.94/(1.-.33*mu);
  return prof*streak*D*D*D;
}
vec3 ramp(float x){
  vec3 c=mix(vec3(.30,.07,.03),vec3(.48,.18,.07),smoothstep(0.,.25,x));
  c=mix(c,vec3(1.,.70,.28),smoothstep(.2,.8,x));
  c=mix(c,vec3(1.,.886,.69),smoothstep(.8,1.5,x));
  c=mix(c,vec3(1.,.98,.95),smoothstep(1.6,2.6,x));
  return c*min(x,1.)+c*max(x-1.,0.)*.35;
}
void main(){
  vec2 p=(gl_FragCoord.xy-u_hole)/u_R;
  float b=length(p);
  float on=u_on;
  // background lensing (point lens, theta_E just inside the shadow so the ring of piled-up sky hugs its edge), faded out far away so the sky edge never moves
  float fall=1.-smoothstep(6.,15.,b);
  vec2 src=p*(1.-.95*on*fall/max(b*b,.0001));
  float dw=(b*u_R-u_wave.x)/u_dpr;
  float wave=u_wave.y*exp(-dw*dw/900.);
  src+=p/max(b,.001)*wave*sin(dw*.16)*12.*u_dpr/u_R;
  vec3 sky=texture2D(u_bg,(u_hole+src*u_R)/u_res).rgb;
  if(on<.001){gl_FragColor=vec4(sky,1.);return;}
  float sh=smoothstep(1.-u_px*1.2,1.+u_px*1.2,b);
  vec3 col=sky*mix(1.,sh,on);
  vec3 em=vec3(0.);
  float ang=atan(p.y,p.x);
  if(b<ROUT*1.25){
    float cr=cos(-.12),sr=sin(-.12);
    mat2 rot=mat2(cr,sr,-sr,cr);
    const float cosI=.3;
    vec2 q=rot*p;
    float bq=max(dot(q,q),.0001);
    // far half: its light is bent up over the shadow (the "hat") and, just under the shadow,
    // flipped into a thin arc. Only y is bent, so it meets the straight near half at the midline.
    vec2 qs=vec2(q.x,q.y*(1.-1.25/bq));
    vec2 dl=vec2(qs.x,qs.y/cosI);
    // near half, straight, in front of the shadow
    vec2 dd=vec2(q.x,q.y/cosI);
    // complementary weights from the unbent y so the halves meet without a seam; inside the
    // flip zone (just under the shadow) the far half shows through as the thin lower arc
    float wn=1.-smoothstep(-.05,.05,dd.y);
    float wf=bq>1.25?1.-wn:step(0.,dl.y);
    float far=wf>0.?disk(length(dl),atan(dl.y,dl.x))*wf:0.;
    float near=wn>0.?disk(length(dd),atan(dd.y,dd.x))*wn:0.;
    // brighter close in (the bent image is magnified), same factor for both halves so they meet cleanly
    float heat=(2.2+u_heat*.9)*(1.+.6*min(1.25/bq,1.));
    em+=ramp(far*sh*heat)+ramp(near*heat);
  }
  // photon ring: thin and lopsided (brighter on the approaching side and below, like M87*)
  float lop=.35+.65*pow(.5-.5*cos(ang-.6),1.3);
  float wpx=max(.03,1.3*u_px);
  em+=vec3(1.,.78,.5)*exp(-pow((b-1.03)/wpx,2.))*lop*1.1*(1.+u_heat*.5);
  em+=vec3(1.,.45,.16)*exp(-max(b-1.,0.)*6.)*sh*.35*lop;
  // soft warm haze and the old purple halo at half strength
  em+=vec3(1.,.5,.2)*exp(-max(b-1.,0.)*.9)*sh*.06*(1.+u_heat);
  em+=vec3(.45,.28,1.)*exp(-max(b-1.,0.)*.55)*sh*.045;
  em+=vec3(1.,.72,.45)*wave*.18*exp(-dw*dw/120.);
  em=1.-exp(-em*1.15);
  gl_FragColor=vec4(col+em*on,1.);
}`

const SPR_VS = `
attribute vec2 a_p;attribute vec2 a_uv;attribute vec4 a_c;attribute vec2 a_fx;
uniform vec2 u_res;uniform vec2 u_off;
varying vec2 v_uv;varying vec4 v_c;varying vec2 v_fx;
void main(){
  vec2 p=(a_p+u_off)/u_res*2.-1.;
  gl_Position=vec4(p.x,-p.y,0.,1.);
  v_uv=a_uv;v_c=a_c;v_fx=a_fx;
}`
const SPR_FS = `
precision mediump float;
uniform sampler2D u_tex;
varying vec2 v_uv;varying vec4 v_c;varying vec2 v_fx;
void main(){
  vec4 t=texture2D(u_tex,v_uv);
  vec3 c=t.rgb*v_c.rgb;
  c=mix(c,vec3(1.,.914,.769)*t.a,v_fx.x);
  c+=vec3(1.,.6,.26)*v_fx.y*t.a;
  gl_FragColor=vec4(c,t.a)*v_c.a;
}`

export const FLOATS = 10
const MAX_V = 60000

export interface HoleUniforms {
  x: number // CSS px
  y: number
  R: number // CSS px
  t: number
  on: number
  heat: number
  waveR: number // CSS px
  waveA: number
}

export class Renderer {
  gl: WebGLRenderingContext
  private hp: WebGLProgram
  private sp: WebGLProgram
  private quad: WebGLBuffer
  private vb: WebGLBuffer
  private ib: WebGLBuffer
  private bgTex: WebGLTexture
  private atlasTex: WebGLTexture
  v = new Float32Array(MAX_V * FLOATS)
  idx = new Uint16Array(MAX_V * 1.6)
  nv = 0
  ni = 0
  w = 1
  h = 1
  dpr = 1
  off = [0, 0]
  private hu: Record<string, WebGLUniformLocation | null> = {}
  private su: Record<string, WebGLUniformLocation | null> = {}

  constructor(public canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: true, preserveDrawingBuffer: false, powerPreference: 'high-performance' })
    if (!gl) throw new Error('no webgl')
    this.gl = gl
    this.hp = prog(gl, HOLE_VS, HOLE_FS)
    this.sp = prog(gl, SPR_VS, SPR_FS)
    for (const n of ['u_bg', 'u_res', 'u_hole', 'u_R', 'u_t', 'u_on', 'u_heat', 'u_px', 'u_wave', 'u_dpr']) this.hu[n] = gl.getUniformLocation(this.hp, n)
    for (const n of ['u_tex', 'u_res', 'u_off']) this.su[n] = gl.getUniformLocation(this.sp, n)
    this.quad = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    this.vb = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vb)
    gl.bufferData(gl.ARRAY_BUFFER, this.v.byteLength, gl.DYNAMIC_DRAW)
    this.ib = gl.createBuffer()!
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ib)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.idx.byteLength, gl.DYNAMIC_DRAW)
    this.bgTex = gl.createTexture()!
    this.atlasTex = gl.createTexture()!
  }

  resize(w: number, h: number, dpr: number) {
    this.w = w
    this.h = h
    this.dpr = dpr
    this.canvas.width = Math.round(w * dpr)
    this.canvas.height = Math.round(h * dpr)
    this.canvas.style.width = w + 'px'
    this.canvas.style.height = h + 'px'
  }

  setBackground(c: HTMLCanvasElement) {
    const gl = this.gl
    gl.bindTexture(gl.TEXTURE_2D, this.bgTex)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, c)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  }

  setAtlas(c: HTMLCanvasElement) {
    const gl = this.gl
    gl.bindTexture(gl.TEXTURE_2D, this.atlasTex)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c)
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  }

  hole(u: HoleUniforms) {
    const gl = this.gl
    const d = this.dpr
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.disable(gl.BLEND)
    gl.useProgram(this.hp)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.bgTex)
    gl.uniform1i(this.hu.u_bg, 0)
    gl.uniform2f(this.hu.u_res, this.canvas.width, this.canvas.height)
    gl.uniform2f(this.hu.u_hole, (u.x + this.off[0]) * d, this.canvas.height - (u.y + this.off[1]) * d)
    const R = Math.max(1, u.R * d)
    gl.uniform1f(this.hu.u_R, R)
    gl.uniform1f(this.hu.u_t, u.t)
    gl.uniform1f(this.hu.u_on, u.on)
    gl.uniform1f(this.hu.u_heat, u.heat)
    gl.uniform1f(this.hu.u_px, 1 / R)
    gl.uniform2f(this.hu.u_wave, u.waveR * d, u.waveA)
    gl.uniform1f(this.hu.u_dpr, d)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    gl.disableVertexAttribArray(0)
  }

  /** Room for n more vertices? */
  room(nv: number, ni: number) {
    return this.nv + nv <= MAX_V && this.ni + ni <= this.idx.length
  }

  vert(x: number, y: number, u: number, v: number, r: number, g: number, b: number, a: number, hot: number, light: number) {
    const o = this.nv * FLOATS
    const V = this.v
    V[o] = x
    V[o + 1] = y
    V[o + 2] = u
    V[o + 3] = v
    V[o + 4] = r
    V[o + 5] = g
    V[o + 6] = b
    V[o + 7] = a
    V[o + 8] = hot
    V[o + 9] = light
    return this.nv++
  }

  tri(a: number, b: number, c: number) {
    const I = this.idx
    I[this.ni++] = a
    I[this.ni++] = b
    I[this.ni++] = c
  }

  /** Axis-aligned-in-local-space quad: centre, half extents along (ax, ay) and its normal. */
  quadRot(x: number, y: number, hw: number, hh: number, cos: number, sin: number, uv: readonly number[], r: number, g: number, b: number, a: number, hot = 0, light = 0) {
    if (!this.room(4, 6)) return
    const ux = cos * hw
    const uy = sin * hw
    const vx = -sin * hh
    const vy = cos * hh
    const i0 = this.vert(x - ux - vx, y - uy - vy, uv[0], uv[1], r, g, b, a, hot, light)
    this.vert(x + ux - vx, y + uy - vy, uv[2], uv[1], r, g, b, a, hot, light)
    this.vert(x + ux + vx, y + uy + vy, uv[2], uv[3], r, g, b, a, hot, light)
    this.vert(x - ux + vx, y - uy + vy, uv[0], uv[3], r, g, b, a, hot, light)
    this.tri(i0, i0 + 1, i0 + 2)
    this.tri(i0, i0 + 2, i0 + 3)
  }

  /** Draw everything queued, then reset. */
  flush(additive = false) {
    if (!this.ni) return
    const gl = this.gl
    gl.useProgram(this.sp)
    gl.enable(gl.BLEND)
    if (additive) gl.blendFunc(gl.ONE, gl.ONE)
    else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.atlasTex)
    gl.uniform1i(this.su.u_tex, 0)
    gl.uniform2f(this.su.u_res, this.w, this.h)
    gl.uniform2f(this.su.u_off, this.off[0], this.off[1])
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vb)
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.v.subarray(0, this.nv * FLOATS))
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ib)
    gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, this.idx.subarray(0, this.ni))
    const S = FLOATS * 4
    for (let i = 0; i < 4; i++) gl.enableVertexAttribArray(i)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, S, 0)
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, S, 8)
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, S, 16)
    gl.vertexAttribPointer(3, 2, gl.FLOAT, false, S, 32)
    gl.drawElements(gl.TRIANGLES, this.ni, gl.UNSIGNED_SHORT, 0)
    for (let i = 0; i < 4; i++) gl.disableVertexAttribArray(i)
    this.nv = 0
    this.ni = 0
  }
}

function prog(gl: WebGLRenderingContext, vs: string, fs: string): WebGLProgram {
  const p = gl.createProgram()!
  for (const [type, src] of [
    [gl.VERTEX_SHADER, vs],
    [gl.FRAGMENT_SHADER, fs],
  ] as const) {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader')
    gl.attachShader(p, s)
  }
  // fixed attribute slots so both programs share the layout
  gl.bindAttribLocation(p, 0, 'a')
  gl.bindAttribLocation(p, 0, 'a_p')
  gl.bindAttribLocation(p, 1, 'a_uv')
  gl.bindAttribLocation(p, 2, 'a_c')
  gl.bindAttribLocation(p, 3, 'a_fx')
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link')
  return p
}
