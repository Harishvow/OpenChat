/**
 * OpenChat — Arch Linux Terminal Theme
 * Zero external dependencies — just React
 * Drop-in: import OpenChat from './OpenChat'
 */
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

/* ════════════════════════════════════════════
   DECRYPTED TEXT  (React Bits — no motion dep)
════════════════════════════════════════════ */
const SR = {
  position:'absolute',width:'1px',height:'1px',padding:0,
  margin:'-1px',overflow:'hidden',clip:'rect(0,0,0,0)',border:0,
};

function DecryptedText({
  text = '',
  speed = 50,
  maxIterations = 10,
  sequential = false,
  revealDirection = 'start',
  useOriginalCharsOnly = false,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+',
  className = '',
  parentClassName = '',
  encryptedClassName = '',
  animateOn = 'hover',
  clickMode = 'once',
  loop = false,
  loopHold = 2500,
}) {
  const [displayText,     setDisplayText]     = useState(text);
  const [isAnimating,     setIsAnimating]     = useState(false);
  const [revealedIndices, setRevealedIndices] = useState(new Set());
  const [hasAnimated,     setHasAnimated]     = useState(false);
  const [isDecrypted,     setIsDecrypted]     = useState(animateOn !== 'click');
  const [direction,       setDirection]       = useState('forward');

  const containerRef = useRef(null);
  const orderRef     = useRef([]);
  const pointerRef   = useRef(0);
  const intervalRef  = useRef(null);

  const pool = useMemo(() =>
    useOriginalCharsOnly
      ? Array.from(new Set(text.split(''))).filter(c => c !== ' ')
      : characters.split(''),
    [useOriginalCharsOnly, text, characters]
  );

  const shuffle = useCallback((orig, revealed) =>
    orig.split('').map((ch, i) => {
      if (ch === ' ') return ' ';
      if (revealed.has(i)) return orig[i];
      return pool[Math.floor(Math.random() * pool.length)];
    }).join(''), [pool]
  );

  const buildOrder = useCallback(len => {
    if (!len) return [];
    if (revealDirection === 'start') return Array.from({length:len},(_,i)=>i);
    if (revealDirection === 'end')   return Array.from({length:len},(_,i)=>len-1-i);
    const mid=Math.floor(len/2), order=[];
    let off=0;
    while (order.length<len){
      const idx=off%2===0?mid+off/2:mid-Math.ceil(off/2);
      if(idx>=0&&idx<len)order.push(idx);
      off++;
    }
    return order.slice(0,len);
  }, [revealDirection]);

  const fillAll = useCallback(()=>{
    const s=new Set(); for(let i=0;i<text.length;i++)s.add(i); return s;
  },[text]);

  const removeRandom = useCallback((set,count)=>{
    const arr=Array.from(set);
    for(let i=0;i<count&&arr.length;i++) arr.splice(Math.floor(Math.random()*arr.length),1);
    return new Set(arr);
  },[]);

  const encryptInstantly = useCallback(()=>{
    const e=new Set(); setRevealedIndices(e); setDisplayText(shuffle(text,e)); setIsDecrypted(false);
  },[text,shuffle]);

  const triggerDecrypt = useCallback(()=>{
    if(sequential){orderRef.current=buildOrder(text.length);pointerRef.current=0;}
    setRevealedIndices(new Set()); setDirection('forward'); setIsAnimating(true);
  },[sequential,buildOrder,text.length]);

  const triggerReverse = useCallback(()=>{
    const full=fillAll();
    if(sequential){
      orderRef.current=buildOrder(text.length).slice().reverse();
      pointerRef.current=0; setRevealedIndices(full); setDisplayText(shuffle(text,full));
    } else { setRevealedIndices(full); setDisplayText(shuffle(text,full)); }
    setDirection('reverse'); setIsAnimating(true);
  },[sequential,buildOrder,fillAll,shuffle,text]);

  const loopTimerRef = useRef(null);

  useEffect(()=>{
    if(!isAnimating) return;
    let iter=0;
    const nextIdx=r=>{
      const len=text.length;
      if(revealDirection==='start') return r.size;
      if(revealDirection==='end')   return len-1-r.size;
      const mid=Math.floor(len/2),off=Math.floor(r.size/2);
      const ni=r.size%2===0?mid+off:mid-off-1;
      if(ni>=0&&ni<len&&!r.has(ni)) return ni;
      for(let i=0;i<len;i++) if(!r.has(i)) return i;
      return 0;
    };
    intervalRef.current=setInterval(()=>{
      setRevealedIndices(prev=>{
        if(sequential&&direction==='forward'){
          if(prev.size<text.length){
            const ni=nextIdx(prev); const nr=new Set(prev); nr.add(ni);
            setDisplayText(shuffle(text,nr)); return nr;
          }
          clearInterval(intervalRef.current); setIsAnimating(false); setIsDecrypted(true);
          // Loop: after hold, trigger reverse
          if(loop){
            loopTimerRef.current=setTimeout(()=>triggerReverse(),loopHold);
          }
          return prev;
        }
        if(sequential&&direction==='reverse'){
          if(pointerRef.current<orderRef.current.length){
            const idx=orderRef.current[pointerRef.current++];
            const nr=new Set(prev); nr.delete(idx); setDisplayText(shuffle(text,nr));
            if(!nr.size){
              clearInterval(intervalRef.current);setIsAnimating(false);setIsDecrypted(false);
              // Loop: after hold, trigger decrypt again
              if(loop){
                loopTimerRef.current=setTimeout(()=>triggerDecrypt(),loopHold/2);
              }
            }
            return nr;
          }
          clearInterval(intervalRef.current); setIsAnimating(false); setIsDecrypted(false);
          if(loop){
            loopTimerRef.current=setTimeout(()=>triggerDecrypt(),loopHold/2);
          }
          return prev;
        }
        if(!sequential&&direction==='forward'){
          setDisplayText(shuffle(text,prev));
          if(++iter>=maxIterations){
            clearInterval(intervalRef.current);setIsAnimating(false);setDisplayText(text);setIsDecrypted(true);
            if(loop){
              loopTimerRef.current=setTimeout(()=>triggerReverse(),loopHold);
            }
          }
          return prev;
        }
        if(!sequential&&direction==='reverse'){
          const cur=prev.size?prev:fillAll();
          const cnt=Math.max(1,Math.ceil(text.length/Math.max(1,maxIterations)));
          const next=removeRandom(cur,cnt); setDisplayText(shuffle(text,next));
          if(!next.size||++iter>=maxIterations){
            clearInterval(intervalRef.current);setIsAnimating(false);setIsDecrypted(false);
            setDisplayText(shuffle(text,new Set()));
            if(loop){
              loopTimerRef.current=setTimeout(()=>triggerDecrypt(),loopHold/2);
            }
            return new Set();
          }
          return next;
        }
        return prev;
      });
    },speed);
    return ()=>{clearInterval(intervalRef.current);clearTimeout(loopTimerRef.current);};
  },[isAnimating,text,speed,maxIterations,sequential,revealDirection,shuffle,direction,fillAll,removeRandom,loop,loopHold,triggerDecrypt,triggerReverse]);

  const handleClick=()=>{
    if(animateOn!=='click') return;
    if(clickMode==='once'&&!isDecrypted) triggerDecrypt();
    if(clickMode==='toggle') isDecrypted?triggerReverse():triggerDecrypt();
  };

  const onEnter=useCallback(()=>{
    if(isAnimating) return;
    setRevealedIndices(new Set());setIsDecrypted(false);setDisplayText(text);
    setDirection('forward');setIsAnimating(true);
  },[isAnimating,text]);

  const onLeave=useCallback(()=>{
    clearInterval(intervalRef.current);setIsAnimating(false);
    setRevealedIndices(new Set());setDisplayText(text);setIsDecrypted(true);setDirection('forward');
  },[text]);

  useEffect(()=>{
    if(animateOn!=='view'&&animateOn!=='inViewHover'&&animateOn!=='loop') return;
    if(animateOn==='loop'){
      // Start immediately for loop mode
      triggerDecrypt();setHasAnimated(true);
      return ()=>{clearTimeout(loopTimerRef.current);};
    }
    const obs=new IntersectionObserver(entries=>{
      entries.forEach(e=>{if(e.isIntersecting&&!hasAnimated){triggerDecrypt();setHasAnimated(true);}});
    },{threshold:0.1});
    const el=containerRef.current; if(el) obs.observe(el);
    return ()=>{if(el) obs.unobserve(el);};
  },[animateOn,hasAnimated,triggerDecrypt]);

  useEffect(()=>{
    if(animateOn==='click') encryptInstantly();
    else{setDisplayText(text);setIsDecrypted(true);}
    setRevealedIndices(new Set());setDirection('forward');
  },[animateOn,text,encryptInstantly]);

  const evts =
    animateOn==='hover'||animateOn==='inViewHover'
      ?{onMouseEnter:onEnter,onMouseLeave:onLeave}
      :animateOn==='click'?{onClick:handleClick,style:{cursor:'pointer'}}:{};

  return (
    <span ref={containerRef} className={parentClassName}
      style={{display:'inline-block',whiteSpace:'pre-wrap'}} {...evts}>
      <span style={SR}>{displayText}</span>
      <span aria-hidden="true">
        {displayText.split('').map((ch,i)=>{
          const done=revealedIndices.has(i)||(!isAnimating&&isDecrypted);
          return <span key={i} className={done?className:encryptedClassName}>{ch}</span>;
        })}
      </span>
    </span>
  );
}

/* ════════════════════════════════════════════
   FAULTY TERMINAL BACKGROUND
   — dual-layer: slow deep rain + fast corrupt
════════════════════════════════════════════ */
function FaultyTerminal() {
  const canvasRef = useRef(null);

  useEffect(()=>{
    const cv=canvasRef.current; if(!cv) return;
    const cx=cv.getContext('2d');
    let raf, f=0;

    const GLYPHS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%!?<>/|\\[]{}~^_+-=*:;';

    const resize=()=>{cv.width=window.innerWidth;cv.height=window.innerHeight;};
    resize();

    // Column state
    const CW=22;
    let cols=[];
    const mkCols=()=>{
      cols=Array.from({length:Math.ceil(cv.width/CW)},(_,i)=>({
        x:i*CW,
        y:-Math.random()*cv.height*1.5,
        spd:0.4+Math.random()*2.2,
        a:0.12+Math.random()*0.45,
        len:8+Math.floor(Math.random()*20),
        tier:Math.random()<0.30?'bright':Math.random()<0.55?'mid':'dim',
        corr:Math.random()<0.10, // corrupted col — flickers hard
      }));
    };
    mkCols();

    // Corruption blocks
    let corrupt=[];

    // Horizontal tear lines
    let tears=[];

    const onResize=()=>{resize();mkCols();};
    window.addEventListener('resize',onResize);

    const draw=()=>{
      f++;

      // Deep fade — slower than standard matrix for ghosting effect
      cx.fillStyle='rgba(5,7,10,0.06)';
      cx.fillRect(0,0,cv.width,cv.height);

      // ── Rain ──
      cx.font=`14px 'Noto Sans JP','JetBrains Mono',monospace`;
      cols.forEach(col=>{
        const baseAlpha = col.tier==='bright'?col.a*2.5:col.tier==='mid'?col.a*1.8:col.a*1.2;
        for(let j=col.len;j>=0;j--){
          const fade=1-j/col.len;
          let a=baseAlpha*fade*(j===0?5:j<3?2.5:1);
          // corrupted columns jitter their alpha violently
          if(col.corr) a*=(Math.random()<0.3?0.1:2.0);
          a=Math.min(a,1.0);

          let r=23,g=147,b=209; // arch blue base
          if(col.tier==='bright'&&j===0){r=200;g=240;b=255;} // white-blue head — brighter
          if(col.tier==='bright'&&j<3){r=120;g=200;b=245;} // bright trail
          if(col.tier==='dim'){r=15;g=100;b=160;}

          cx.fillStyle=`rgba(${r},${g},${b},${a.toFixed(3)})`;
          const glyph=GLYPHS[Math.floor(Math.random()*GLYPHS.length)];
          cx.fillText(glyph, col.x, col.y-j*16);
        }

        col.y+=col.spd*(col.corr&&f%8===0?-3:1); // corrupted cols jerk up occasionally
        if(col.y>cv.height+col.len*16){
          col.y=-col.len*16;
          col.spd=0.4+Math.random()*2.2;
          col.a=0.12+Math.random()*0.45;
          col.tier=Math.random()<0.30?'bright':Math.random()<0.55?'mid':'dim';
          col.corr=Math.random()<0.10;
        }
      });

      // ── Corruption blocks ──
      if(Math.random()<0.08){
        corrupt.push({
          x:Math.random()*cv.width*0.7,
          y:Math.random()*cv.height,
          w:40+Math.random()*280,
          h:1+Math.random()*4,
          a:0.08+Math.random()*0.25,
          life:3+Math.floor(Math.random()*8),
          color:Math.random()<0.6?`rgba(23,147,209,`:`rgba(0,255,180,`,
        });
      }
      corrupt=corrupt.filter(b=>b.life-->0);
      corrupt.forEach(b=>{
        cx.fillStyle=`${b.color}${b.a})`;
        cx.fillRect(b.x,b.y,b.w,b.h);
      });

      // ── Horizontal tear lines (rare, dramatic) ──
      if(f%300===0&&Math.random()<0.6){
        tears.push({
          y:Math.random()*cv.height,
          a:0.15,
          life:8,
          thick:1+Math.floor(Math.random()*3),
        });
      }
      tears=tears.filter(t=>t.life-->0);
      tears.forEach(t=>{
        cx.save();
        cx.globalAlpha=t.a*(t.life/8);
        cx.fillStyle='#1793d1';
        cx.fillRect(0,t.y,cv.width,t.thick);
        // pixel-shift effect on tear
        cx.fillStyle='rgba(0,255,180,0.15)';
        cx.fillRect(Math.random()*40-20,t.y+t.thick,cv.width*0.6,1);
        cx.restore();
      });

      // ── Flicker (full-frame alpha pulse — more frequent) ──
      if(f%180===0&&Math.random()<0.5){
        cx.save(); cx.globalAlpha=0.08;
        cx.fillStyle='#1793d1';
        cx.fillRect(0,0,cv.width,cv.height);
        cx.restore();
      }

      // ── Ambient glow pulse — breathing highlight ──
      const pulse=Math.sin(f*0.012)*0.5+0.5;
      cx.save();
      cx.globalAlpha=0.015+pulse*0.025;
      const grd=cx.createRadialGradient(cv.width/2,cv.height/2,0,cv.width/2,cv.height/2,cv.width*0.6);
      grd.addColorStop(0,'rgba(23,147,209,0.6)');
      grd.addColorStop(0.5,'rgba(0,229,204,0.15)');
      grd.addColorStop(1,'transparent');
      cx.fillStyle=grd;
      cx.fillRect(0,0,cv.width,cv.height);
      cx.restore();

      raf=requestAnimationFrame(draw);
    };
    draw();
    return ()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',onResize);};
  },[]);

  return <canvas ref={canvasRef} style={{
    position:'fixed',inset:0,width:'100vw',height:'100vh',
    pointerEvents:'none',zIndex:0,
  }}/>;
}

/* ════════════════════════════════════════════
   STYLES
════════════════════════════════════════════ */
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,300;0,400;0,700;1,400&family=Martian+Mono:wght@300;400;700&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;overflow:hidden;}

:root{
  --bg:         #05070a;
  --surface:    rgba(8,12,18,0.55);
  --surface2:   rgba(12,18,26,0.45);
  --arch:       #1793d1;
  --arch2:      #0fa8e0;
  --cyan:       #00e5cc;
  --glow:       0 0 18px rgba(23,147,209,0.7),0 0 50px rgba(23,147,209,0.25);
  --glow-sm:    0 0 8px rgba(23,147,209,0.55);
  --glow-lg:    0 0 30px rgba(23,147,209,0.5),0 0 80px rgba(23,147,209,0.15);
  --arch-dim:   rgba(23,147,209,0.10);
  --fg:         #b8cfe8;
  --fg-bright:  #ddeeff;
  --fg-dim:     rgba(184,207,232,0.32);
  --fg-faint:   rgba(184,207,232,0.1);
  --green:      #89e0a0;
  --red:        #e07878;
  --amber:      #e0c068;
  --border:     rgba(23,147,209,0.20);
  --border-b:   rgba(23,147,209,0.45);
  --border-c:   rgba(23,147,209,0.65);
  --mono:       'JetBrains Mono',monospace;
  --display:    'Martian Mono','JetBrains Mono',monospace;
}

body{
  background:var(--bg);
  color:var(--fg);
  font-family:var(--mono);
}

/* CRT scanlines — subtler so background shows through */
body::before{
  content:'';position:fixed;inset:0;z-index:9999;pointer-events:none;
  background:repeating-linear-gradient(
    0deg,transparent,transparent 3px,
    rgba(0,0,0,0.04) 3px,rgba(0,0,0,0.04) 4px
  );
  animation:scanScroll 12s linear infinite;
}
@keyframes scanScroll{
  from{background-position:0 0}
  to{background-position:0 100vh}
}

/* RGB aberration vignette — softened to let background breathe */
body::after{
  content:'';position:fixed;inset:0;z-index:9998;pointer-events:none;
  background:
    radial-gradient(ellipse 90% 70% at 50% 50%, transparent 50%, rgba(5,7,10,0.55) 100%);
}

/* ── Full screen window ── */
.w{
  position:fixed;inset:0;z-index:1;
  background:var(--surface);
  display:flex;flex-direction:column;
  overflow:hidden;
  backdrop-filter:blur(6px);
}

/* ── Top chrome ── */
.top{
  display:flex;align-items:stretch;
  border-bottom:1px solid var(--border);
  flex-shrink:0;
  background:rgba(5,7,10,0.45);
  backdrop-filter:blur(12px);
}

/* Left panel of top bar */
.top-left{
  display:flex;align-items:center;gap:10px;
  padding:0 18px;
  border-right:1px solid var(--border);
  min-width:220px;
}
.tlabel{
  font-size:10px;letter-spacing:2px;color:var(--fg-dim);
  text-transform:uppercase;
}

/* Tab style title */
.top-tab{
  flex:1;display:flex;align-items:center;justify-content:center;
  padding:12px 0;
  font-size:11px;letter-spacing:3px;color:var(--fg-dim);
  border-right:1px solid var(--border);
  position:relative;
}
.top-tab::after{
  content:'';position:absolute;bottom:0;left:10%;right:10%;
  height:1px;background:var(--arch);opacity:0.4;
}

.top-right{
  display:flex;align-items:center;gap:16px;
  padding:0 18px;min-width:220px;justify-content:flex-end;
}
.tclock{
  font-size:11px;color:var(--fg-dim);letter-spacing:2px;
  font-variant-numeric:tabular-nums;
}

/* Traffic dots */
.dots{display:flex;gap:6px;align-items:center;}
.dot{width:10px;height:10px;border-radius:50%;}
.dot.r{background:rgba(224,120,120,0.25);border:1px solid var(--red);}
.dot.y{background:rgba(224,192,104,0.25);border:1px solid var(--amber);}
.dot.g{background:rgba(137,224,160,0.25);border:1px solid var(--green);}

/* ── Left sidebar ── */
.layout{flex:1;display:flex;overflow:hidden;}

.sidebar{
  width:200px;flex-shrink:0;
  border-right:1px solid var(--border);
  padding:24px 0;
  display:flex;flex-direction:column;gap:2px;
  background:rgba(5,7,10,0.25);
  backdrop-filter:blur(10px);
  overflow:hidden;
}
.sb-label{
  font-size:9px;letter-spacing:3px;color:var(--fg-faint);
  text-transform:uppercase;padding:0 18px 10px;
}
.sb-item{
  display:flex;align-items:center;gap:10px;
  padding:8px 18px;font-size:11px;
  color:var(--fg-dim);letter-spacing:0.5px;
  border-left:2px solid transparent;
  transition:color .15s,border-color .15s,background .15s;
  cursor:default;
}
.sb-item.active{
  color:var(--arch);
  border-left-color:var(--arch);
  background:rgba(23,147,209,0.06);
}
.sb-item .ic{font-size:13px;width:16px;text-align:center;}

.sb-spacer{flex:1;}

.sb-bottom{
  padding:16px 18px;
  border-top:1px solid var(--border);
  font-size:9px;letter-spacing:1.5px;
  color:var(--fg-faint);text-transform:uppercase;
}
.sb-bottom .arch-v{color:rgba(23,147,209,0.4);}

/* ── Main content ── */
.main{
  flex:1;display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  padding:60px 80px;
  position:relative;overflow:hidden;
  background:rgba(5,7,10,0.15);
}

/* Corner accents */
.corner{position:absolute;width:32px;height:32px;opacity:0.5;}
.corner.tl{top:20px;left:20px;border-top:1px solid var(--border-c);border-left:1px solid var(--border-c);}
.corner.tr{top:20px;right:20px;border-top:1px solid var(--border-c);border-right:1px solid var(--border-c);}
.corner.bl{bottom:20px;left:20px;border-bottom:1px solid var(--border-c);border-left:1px solid var(--border-c);}
.corner.br{bottom:20px;right:20px;border-bottom:1px solid var(--border-c);border-right:1px solid var(--border-c);}

/* System tag */
.sys-tag{
  position:absolute;top:24px;left:50%;transform:translateX(-50%);
  font-size:9px;letter-spacing:3px;color:var(--fg-faint);
  text-transform:uppercase;display:flex;align-items:center;gap:8px;
}
.sys-tag::before,.sys-tag::after{
  content:'';width:40px;height:1px;background:var(--border-b);display:inline-block;
}

/* Arch triangle big watermark */
.arch-bg-mark{
  position:absolute;
  right:-40px;bottom:-60px;
  width:340px;height:340px;
  clip-path:polygon(50% 0%,0% 100%,100% 100%);
  background:rgba(23,147,209,0.025);
  pointer-events:none;
}

/* ── Prompt line ── */
.prompt{
  display:flex;align-items:center;gap:0;
  margin-bottom:16px;font-size:13px;
  color:var(--fg-dim);letter-spacing:0.3px;
}
.prompt .pu{color:var(--cyan);}
.prompt .pat{color:var(--fg-dim);}
.prompt .ph{color:var(--arch);}
.prompt .pp{color:rgba(23,147,209,0.45);}
.prompt .ps{color:var(--fg-dim);margin:0 6px;}
.cursor{
  display:inline-block;width:9px;height:15px;
  background:var(--arch);margin-left:3px;
  animation:cur 1s step-end infinite;
  vertical-align:middle;
  box-shadow:var(--glow-sm);
}
@keyframes cur{0%,100%{opacity:1}50%{opacity:0}}

/* ── Brand ── */
.brand{
  font-family:var(--display);
  font-size:clamp(52px,8.5vw,108px);
  font-weight:700;
  letter-spacing:-3px;
  line-height:0.95;
  margin-bottom:6px;
  position:relative;
  text-shadow:0 0 40px rgba(23,147,209,0.3),0 0 80px rgba(23,147,209,0.1);
}

/* Glitch clone effect on brand */
.brand::before,.brand::after{
  content:attr(data-text);
  position:absolute;top:0;left:0;
  font-family:var(--display);
  font-size:inherit;font-weight:700;letter-spacing:-3px;
  opacity:0;pointer-events:none;
}
.brand::before{
  color:rgba(23,147,209,0.6);
  clip-path:polygon(0 30%,100% 30%,100% 45%,0 45%);
  animation:gb1 7s ease-in-out infinite;
}
.brand::after{
  color:rgba(0,229,204,0.4);
  clip-path:polygon(0 60%,100% 60%,100% 70%,0 70%);
  animation:gb2 7s ease-in-out infinite;
}
@keyframes gb1{
  0%,90%,100%{opacity:0;transform:none}
  92%{opacity:1;transform:translateX(-3px)}
  94%{opacity:0.5;transform:translateX(2px)}
  96%{opacity:0}
}
@keyframes gb2{
  0%,91%,100%{opacity:0;transform:none}
  93%{opacity:1;transform:translateX(3px)}
  95%{opacity:0.3;transform:translateX(-1px)}
  97%{opacity:0}
}

.enc-char{
  color:var(--arch);
  text-shadow:var(--glow);
  font-style:italic;
}
.plain-char{color:var(--fg-bright);}

/* ── Version badge ── */
.ver{
  display:inline-flex;align-items:center;gap:8px;
  font-size:10px;letter-spacing:2px;color:var(--fg-dim);
  margin-bottom:32px;text-transform:uppercase;
}
.ver .vbadge{
  background:var(--arch-dim);
  border:1px solid var(--border-b);
  color:var(--arch);padding:2px 10px;
  font-size:9px;letter-spacing:2px;
  border-radius:1px;
}

/* ── Divider ── */
.div{
  width:min(480px,75%);height:1px;margin-bottom:32px;
  position:relative;
}
.div::before{
  content:'';position:absolute;inset:0;
  background:linear-gradient(90deg,
    transparent,rgba(23,147,209,0.5) 30%,
    var(--arch) 50%,rgba(23,147,209,0.5) 70%,transparent);
}
.div::after{
  content:'◆';position:absolute;left:50%;top:50%;
  transform:translate(-50%,-50%);
  color:var(--arch);font-size:8px;
  background:var(--surface);padding:0 6px;
  text-shadow:var(--glow-sm);
}

/* ── Button — Cyan Neon Terminal ── */
.btn-wrap{
  position:relative;
  display:inline-flex;align-items:center;gap:14px;
}
.btn-pfx{
  font-family:var(--mono);font-size:11px;letter-spacing:2px;
  color:var(--cyan);text-shadow:0 0 10px rgba(0,229,204,0.5);
  animation:pfxBlink 2.5s step-end infinite;
  user-select:none;
}
@keyframes pfxBlink{0%,100%{opacity:1}45%{opacity:1}50%{opacity:0.3}55%{opacity:1}}
.btn{
  font-family:var(--mono);font-size:12px;
  font-weight:500;letter-spacing:2.5px;
  text-transform:lowercase;
  color:var(--cyan);
  background:rgba(0,229,204,0.04);
  border:1px solid rgba(0,229,204,0.4);
  padding:14px 48px;cursor:pointer;
  position:relative;outline:none;
  transition:border-color .25s,box-shadow .25s,background .25s,transform .15s;
  overflow:hidden;
}
.btn::before{
  content:'';position:absolute;inset:0;
  background:linear-gradient(90deg,transparent 0%,rgba(0,229,204,0.06) 50%,transparent 100%);
  animation:btnSweep 4s ease-in-out infinite;
  pointer-events:none;
}
@keyframes btnSweep{
  0%{transform:translateX(-100%)}
  50%{transform:translateX(100%)}
  100%{transform:translateX(-100%)}
}
.btn:hover{
  border-color:var(--cyan);
  background:rgba(0,229,204,0.08);
  box-shadow:0 0 15px rgba(0,229,204,0.35),0 0 40px rgba(0,229,204,0.1),inset 0 0 20px rgba(0,229,204,0.04);
  transform:translateY(-2px);
}
.btn:active{transform:translateY(0);background:rgba(0,229,204,0.12);}
.btn:disabled{
  opacity:0.3;cursor:not-allowed;transform:none;box-shadow:none;
}
.btn .enc-char{
  color:var(--cyan);
  text-shadow:0 0 10px rgba(0,229,204,0.6);
  font-style:italic;
}
.btn .plain-char{color:var(--cyan);}

/* Loading dots */
.ld{display:inline-flex;gap:6px;align-items:center;}
.ld b{
  width:5px;height:5px;border-radius:50%;
  background:var(--arch);display:inline-block;
  animation:ldp 1.1s ease-in-out infinite;
}
.ld b:nth-child(2){animation-delay:.18s;}
.ld b:nth-child(3){animation-delay:.36s;}
@keyframes ldp{0%,80%,100%{opacity:0.2;transform:scale(0.8)}40%{opacity:1;transform:scale(1.2)}}

/* ── Result ── */
.result{
  width:min(560px,88%);margin-top:24px;
  display:flex;flex-direction:column;gap:6px;
  animation:fadeUp .35s cubic-bezier(.22,.68,0,1.2) both;
}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

.log{
  background:rgba(0,0,0,0.55);
  border:1px solid var(--border);
  padding:10px 14px;font-size:11px;line-height:2;
  position:relative;
}
.log::before{
  content:'STDOUT';position:absolute;top:-1px;right:12px;
  font-size:8px;letter-spacing:2px;color:var(--fg-faint);
  background:var(--bg);padding:0 6px;
}
.log .ok  {color:var(--green);}
.log .err {color:var(--red);}
.log .info{color:var(--fg-dim);}
.log .mk  {color:var(--arch);}

.link-row{
  display:flex;align-items:center;gap:8px;
  padding:10px 14px;
  border:1px solid var(--border-b);
  background:rgba(23,147,209,0.04);
  position:relative;
}
.link-row::before{
  content:'';position:absolute;left:0;top:0;bottom:0;
  width:2px;background:var(--arch);
  box-shadow:var(--glow-sm);
}
.lpfx{color:var(--fg-dim);font-size:10px;white-space:nowrap;letter-spacing:1px;}
.linput{
  flex:1;background:transparent;border:none;outline:none;
  font-family:var(--mono);font-size:11px;
  color:var(--arch);text-shadow:0 0 10px rgba(23,147,209,0.5);
  min-width:0;letter-spacing:0.5px;
}
.cbtn{
  font-family:var(--mono);font-size:10px;letter-spacing:1.5px;
  background:transparent;border:1px solid var(--border-b);
  color:var(--fg-dim);padding:4px 14px;
  cursor:pointer;
  clip-path:polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%);
  transition:color .15s,border-color .15s;white-space:nowrap;
}
.cbtn:hover{color:var(--arch);border-color:var(--arch);}
.cbtn.ok{color:var(--green);border-color:var(--green);}

.acts{display:flex;justify-content:flex-end;}
.newbtn{
  font-family:var(--mono);font-size:10px;letter-spacing:1.5px;
  background:transparent;border:none;color:var(--fg-dim);
  cursor:pointer;padding:2px 0;transition:color .15s;
}
.newbtn:hover{color:var(--cyan);}
.newbtn::before{content:'[~] ';color:rgba(23,147,209,0.35);}

/* ── Status bar ── */
.sbar{
  display:flex;align-items:center;
  border-top:1px solid var(--border);
  background:rgba(3,5,8,0.45);
  font-size:10px;letter-spacing:1px;color:var(--fg-dim);
  flex-shrink:0;
  backdrop-filter:blur(12px);
}
.sbar-seg{
  display:flex;align-items:center;gap:8px;
  padding:7px 16px;
  border-right:1px solid var(--border);
}
.sbar-seg:last-child{border-right:none;margin-left:auto;}
.sbar .alive{color:var(--arch);text-shadow:var(--glow-sm);font-size:8px;}
.sbar .branch{color:var(--cyan);}
.sbar .warn{color:var(--amber);}
.sbar-flex{flex:1;display:flex;align-items:center;justify-content:center;}
`;

/* ════════════════════════════════════════════
   MAIN APP
════════════════════════════════════════════ */
const pad = n => String(n).padStart(2, '0');

const BOOT = [
  { t: 'info', v: 'pacman -Sy openchat-session' },
  { t: 'info', v: 'resolving dependencies...' },
  { t: 'info', v: 'mounting encrypted tunnel...' },
  { t: 'info', v: 'signing ephemeral token...' },
];

const SIDEBAR_ITEMS = [
  { ic: '⬡', label: 'sessions',  active: true  },
  { ic: '≋', label: 'network',   active: false },
  { ic: '⚿', label: 'keys',      active: false },
  { ic: '◈', label: 'logs',      active: false },
  { ic: '⊞', label: 'settings',  active: false },
];

export default function OpenChat() {
  const [clock,      setClock]      = useState('--:--:--');
  const [dateStr,    setDateStr]    = useState('');
  const [loading,    setLoading]    = useState(false);
  const [logs,       setLogs]       = useState([]);
  const [link,       setLink]       = useState('');
  const [copied,     setCopied]     = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`);
      setDateStr(d.toLocaleDateString('en-GB', {
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
      }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const generate = async () => {
    setLoading(true); setShowResult(true); setLogs([]); setLink('');
    for (const line of BOOT) {
      await new Promise(r => setTimeout(r, 310));
      setLogs(p => [...p, line]);
    }
    try {
      const res  = await fetch('/create-chatLink');
      const data = await res.json();
      if (!data.link) throw new Error('no link');
      const chatId = data.chatId || data.link.split('/').pop();
      setLogs(p => [...p, { t: 'ok', v: '[✓] link provisioned — connection ready' }]);
      setLink(`/chat/${chatId}`);
    } catch {
      setLogs(p => [...p, { t: 'err', v: '[✗] handshake failed — host unreachable' }]);
    }
    setLoading(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => { setShowResult(false); setLogs([]); setLink(''); };

  return (
    <>
      <style>{CSS}</style>
      <FaultyTerminal />

      <div className="w">

        {/* ── Top chrome ── */}
        <div className="top">
          <div className="top-left">
            <div className="dots">
              <div className="dot r"/><div className="dot y"/><div className="dot g"/>
            </div>
            <span className="tlabel">openchat</span>
          </div>

          <div className="top-tab">openchat — bash — session/main</div>

          <div className="top-right">
            <span className="tclock">{clock}</span>
          </div>
        </div>

        {/* ── Layout ── */}
        <div className="layout">

          {/* Sidebar */}
          <div className="sidebar">
            <div className="sb-label">workspace</div>
            {SIDEBAR_ITEMS.map(item => (
              <div key={item.label} className={`sb-item${item.active ? ' active' : ''}`}>
                <span className="ic">{item.ic}</span>
                <span>{item.label}</span>
              </div>
            ))}
            <div className="sb-spacer"/>
            <div className="sb-bottom">
              arch linux<br/>
              <span className="arch-v">6.9.3-arch1-1</span>
            </div>
          </div>

          {/* Main content */}
          <div className="main">
            {/* Corner accents */}
            <div className="corner tl"/><div className="corner tr"/>
            <div className="corner bl"/><div className="corner br"/>
            <div className="arch-bg-mark"/>

            <div className="sys-tag">openchat · secure · v2.0</div>

            {/* Prompt */}
            <div className="prompt">
              <span className="pu">root</span>
              <span className="pat">@</span>
              <span className="ph">archlinux</span>
              <span className="pp">  ~/session</span>
              <span className="ps">λ</span>
              <span className="cursor"/>
            </div>

            {/* Brand with glitch + DecryptedText — continuous loop */}
            <div className="brand" data-text="OpenChat">
              <DecryptedText
                text="OpenChat"
                animateOn="loop"
                loop
                loopHold={3000}
                sequential
                revealDirection="center"
                speed={60}
                maxIterations={16}
                characters="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%!?<>/|[]{}~^アイウエオ"
                className="plain-char"
                encryptedClassName="enc-char"
              />
            </div>

            <div className="ver">
              <span className="vbadge">stable</span>
              secure anonymous ephemeral
            </div>

            <div className="div"/>

            {/* Button — Cyan neon terminal style */}
            <div className="btn-wrap">
              <span className="btn-pfx">▸</span>
              <button className="btn" onClick={generate} disabled={loading}>
                {loading
                  ? <span className="ld"><b/><b/><b/></span>
                  : <DecryptedText
                      text={showResult ? 'regenerate' : 'generate link'}
                      animateOn="hover"
                      speed={28}
                      maxIterations={7}
                      characters="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%!?"
                      className="plain-char"
                      encryptedClassName="enc-char"
                    />
                }
              </button>
            </div>

            {/* Result */}
            {showResult && (
              <div className="result">
                <div className="log">
                  {logs.map((l, i) => (
                    <div key={i} className={l.t}>
                      {l.t === 'info' && <span className="mk">» </span>}
                      {l.v}
                    </div>
                  ))}
                </div>
                {link && (
                  <div className="link-row">
                    <span className="lpfx">link://</span>
                    <input className="linput" readOnly value={link}/>
                    <button className={`cbtn${copied ? ' ok' : ''}`} onClick={copyLink}>
                      {copied ? 'copied ✓' : 'copy'}
                    </button>
                  </div>
                )}
                <div className="acts">
                  <button className="newbtn" onClick={reset}>new session</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Status bar ── */}
        <div className="sbar">
          <div className="sbar-seg">
            <span className="alive">●</span>
            <span>connected</span>
          </div>
          <div className="sbar-seg">
            <span className="branch">⎇ main</span>
          </div>
          <div className="sbar-seg">
            <span className="warn">⚠</span>
            <span>end-to-end encrypted</span>
          </div>
          <div className="sbar-flex"/>
          <div className="sbar-seg">
            <span>{dateStr}</span>
          </div>
          <div className="sbar-seg">
            <span>guest@openchat</span>
          </div>
        </div>

      </div>
    </>
  );
}