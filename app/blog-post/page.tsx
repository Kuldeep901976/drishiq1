'use client';

import { useState } from 'react';

export default function BlogPostPage() {
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  const handlePlayVideo = (videoId: string) => {
    setPlayingVideo(videoId);
  };

  return (
    <div style={{
      fontFamily: "'Segoe UI', sans-serif",
      background: '#F5FAF6',
      color: '#222',
      margin: 0,
      padding: 0
    }}>
      <main style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '1.5rem',
        padding: '1.5rem 2rem',
        alignItems: 'flex-start'
      }}>
        <div style={{
          flex: 8,
          background: '#fff',
          padding: '1.5rem',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }}>
          <h1 style={{
            fontSize: '2rem',
            color: '#0B4422',
            marginBottom: '0.3rem'
          }}>Why We Struggle With Everyday Problems</h1>
          <div style={{
            fontSize: '0.8rem',
            color: '#888',
            marginBottom: '1.2rem'
          }}>By Team DrishiQ • July 6, 2025</div>
          
          <img 
            src="https://via.placeholder.com/800x600" 
            alt="Struggling with problems"
            style={{
              width: '100%',
              borderRadius: '8px',
              margin: '1rem 0',
              aspectRatio: '4 / 3',
              objectFit: 'cover'
            }}
          />
          
          <p style={{ lineHeight: '1.6', marginBottom: '0.9rem' }}>
            We all face problems. Some are obvious — a missed deadline, a relationship argument, a looming health concern. Others simmer beneath the surface: dissatisfaction at work, an unclear life direction, or emotional burnout. Yet, strangely enough, most of these problems don&apos;t explode because of how serious they are, but because of how long they go unaddressed.
          </p>
          
          <p style={{ lineHeight: '1.6', marginBottom: '0.9rem' }}>
            This delay — this tendency to ignore, postpone, or overcomplicate our challenges — creates a cascading effect. A small misunderstanding becomes a permanent fallout. A minor stressor becomes chronic anxiety. A moment of confusion becomes years of feeling lost.
          </p>
          
          <h2 style={{
            color: '#0B4422',
            fontSize: '1.4rem',
            marginTop: '1.2rem'
          }}>The Hidden Layers of Everyday Problems</h2>
          
          <p style={{ lineHeight: '1.6', marginBottom: '0.9rem' }}>
            Contrary to popular belief, most problems are not isolated events. They are often multi-layered experiences influenced by our environment, relationships, unspoken expectations, and personal beliefs. Think of them like onions — you have to peel through the emotional layers, assumptions, and perspectives to truly understand what you&apos;re dealing with.
          </p>
          
          <p style={{ lineHeight: '1.6', marginBottom: '0.9rem' }}>For instance:</p>
          <ul style={{ lineHeight: '1.6', marginBottom: '0.9rem' }}>
            <li>A fight with your partner may not be about the dishes — it could be about feeling unappreciated.</li>
            <li>Trouble focusing at work may not be about laziness — it might signal a deeper disconnect with your goals.</li>
            <li>Feeling stuck in life isn&apos;t always about a lack of options — it could stem from not knowing how to process your inner conflict.</li>
          </ul>
          
          <h2 style={{
            color: '#0B4422',
            fontSize: '1.4rem',
            marginTop: '1.2rem'
          }}>So Why Don&apos;t We Solve These Problems Sooner?</h2>
          
          <p style={{ lineHeight: '1.6', marginBottom: '0.9rem' }}>There are three main reasons:</p>
          <ul style={{ lineHeight: '1.6', marginBottom: '0.9rem' }}>
            <li><strong>Lack of Clarity:</strong> When you&apos;re in the problem, it&apos;s hard to see the problem. Emotions cloud judgment.</li>
            <li><strong>Fear of Confrontation:</strong> Many problems involve other people. Bringing them up feels risky, so we suppress them.</li>
            <li><strong>Overthinking vs. Action:</strong> We think in circles, hoping for the perfect moment — but it rarely arrives.</li>
          </ul>
          
          <p style={{ lineHeight: '1.6', marginBottom: '0.9rem' }}>The result? Unresolved issues become life patterns.</p>
          
          <h2 style={{
            color: '#0B4422',
            fontSize: '1.4rem',
            marginTop: '1.2rem'
          }}>DrishiQ: Your Thinking Partner in a Noisy World</h2>
          
          <p style={{ lineHeight: '1.6', marginBottom: '0.9rem' }}>
            Drishiq is built to address this exact human dilemma. It&apos;s more than a tool — it&apos;s a thinking companion that helps you organize your thoughts, confront your challenges, and gain clarity through intelligent, unbiased conversation.
          </p>
          
          <p style={{ lineHeight: '1.6', marginBottom: '0.9rem' }}>Unlike motivational quotes or advice threads, Drishiq doesn&apos;t throw pre-cooked solutions at you. It:</p>
          <ul style={{ lineHeight: '1.6', marginBottom: '0.9rem' }}>
            <li>Listens deeply.</li>
            <li>Asks the right questions.</li>
            <li>Maps out the people and expectations around your problem.</li>
            <li>Helps you peel back the layers — until the core is revealed.</li>
          </ul>
          
          <p style={{ lineHeight: '1.6', marginBottom: '0.9rem' }}>Once that happens, solutions become obvious. They arise naturally, because you finally understand the real issue.</p>
          
          <h2 style={{
            color: '#0B4422',
            fontSize: '1.4rem',
            marginTop: '1.2rem'
          }}>Why Timing Is a Myth — and Understanding Is Power</h2>
          
          <p style={{ lineHeight: '1.6', marginBottom: '0.9rem' }}>We often tell ourselves, &quot;I&apos;ll deal with this when the time is right.&quot; But truthfully, time doesn&apos;t fix problems — understanding does.</p>
          
          <p style={{ lineHeight: '1.6', marginBottom: '0.9rem' }}>When you know:</p>
          <ul style={{ lineHeight: '1.6', marginBottom: '0.9rem' }}>
            <li>What the problem actually is</li>
            <li>Who it affects</li>
            <li>What expectations are driving the pain</li>
            <li>What outcomes matter most to you</li>
          </ul>
          
          <p style={{ lineHeight: '1.6', marginBottom: '0.9rem' }}>— you gain power. Not the power to control everything, but the power to act with clarity, courage, and conviction.</p>
          
          <p style={{ lineHeight: '1.6', marginBottom: '0.9rem' }}>That&apos;s what Drishiq empowers you to do.</p>
          
          <h2 style={{
            color: '#0B4422',
            fontSize: '1.4rem',
            marginTop: '1.2rem'
          }}>Start Small. Think Deep. Live Clear.</h2>
          
          <p style={{ lineHeight: '1.6', marginBottom: '0.9rem' }}>
            You don&apos;t need to wait for a crisis. You can bring your smallest confusions, daily tensions, or emotional fog into Drishiq — and start peeling.
          </p>
          
          <p style={{ lineHeight: '1.6', marginBottom: '0.9rem' }}>You&apos;ll be surprised how much clarity can come from a single conversation.</p>
          
          <blockquote style={{
            borderLeft: '4px solid #0B4422',
            paddingLeft: '1rem',
            fontStyle: 'italic',
            color: '#444',
            background: '#EFF7F1',
            margin: '1rem 0',
            borderRadius: '6px'
          }}>
            Because sometimes, the problem is not the problem. It&apos;s how you&apos;ve been thinking about it.
          </blockquote>
          
          <p style={{ lineHeight: '1.6', marginBottom: '0.9rem' }}><strong>Let Drishiq help you change that — one problem at a time.</strong></p>
          
          <div style={{ marginTop: '1.2rem' }}>
            <span style={{
              background: '#0B4422',
              color: '#EFF7F1',
              padding: '4px 10px',
              borderRadius: '20px',
              marginRight: '6px',
              fontSize: '0.8rem',
              display: 'inline-block'
            }}>Clarity</span>
            <span style={{
              background: '#0B4422',
              color: '#EFF7F1',
              padding: '4px 10px',
              borderRadius: '20px',
              marginRight: '6px',
              fontSize: '0.8rem',
              display: 'inline-block'
            }}>Reflection</span>
            <span style={{
              background: '#0B4422',
              color: '#EFF7F1',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              display: 'inline-block'
            }}>Emotional Intelligence</span>
          </div>
          
          <div style={{
            marginTop: '1.5rem',
            fontSize: '0.85rem',
            fontWeight:'500',
            color: '#000080',
            borderTop: '1px solid #ddd',
            paddingTop: '1rem',
            textAlign: 'center'
          }}>
            Want to experience Drishiq? <a href="/app" style={{ color: '#0B4422', textDecoration: 'none', fontWeight: '500' }}>Start your session →</a>
          </div>
        </div>

        <div style={{
          flex: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: '1.2rem'
        }}>
          <div style={{ marginBottom: '-18px', maxWidth: '216px' }}>
            <input 
              type="text" 
              placeholder="🔍 Search videos..." 
              style={{
                padding: '8px 12px',
                width: '100%',
                fontSize: '0.85rem',
                border: '1px solid #ccc',
                borderRadius: '8px'
              }}
            />
          </div>

          <div style={{
            height: '324px',
            overflowY: 'auto',
            scrollSnapType: 'y mandatory',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '8px',
            background: '#fff',
            marginTop: '6px'
          }}>
            <div 
              style={{
                scrollSnapAlign: 'center',
                width: '100%',
                marginBottom: '1rem',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid #eee'
              }}
              onClick={() => handlePlayVideo('Ks-_Mh1QhMc')}
            >
              {playingVideo === 'Ks-_Mh1QhMc' ? (
                <iframe
                  src="https://www.youtube.com/embed/Ks-_Mh1QhMc?autoplay=1"
                  allowFullScreen
                  style={{ width: '100%', height: '180px', borderRadius: '8px', border: 'none' }}
                />
              ) : (
                <img 
                  src="https://img.youtube.com/vi/Ks-_Mh1QhMc/0.jpg" 
                  alt="Video 1" 
                  style={{
                    width: '100%',
                    height: '120px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'block'
                  }}
                />
              )}
            </div>
            <div 
              style={{
                scrollSnapAlign: 'center',
                width: '100%',
                marginBottom: '1rem',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid #eee'
              }}
              onClick={() => handlePlayVideo('lTTajzrSkCw')}
            >
              {playingVideo === 'lTTajzrSkCw' ? (
                <iframe
                  src="https://www.youtube.com/embed/lTTajzrSkCw?autoplay=1"
                  allowFullScreen
                  style={{ width: '100%', height: '180px', borderRadius: '8px', border: 'none' }}
                />
              ) : (
                <img 
                  src="https://img.youtube.com/vi/lTTajzrSkCw/0.jpg" 
                  alt="Video 2" 
                  style={{
                    width: '100%',
                    height: '120px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'block'
                  }}
                />
              )}
            </div>
            <div 
              style={{
                scrollSnapAlign: 'center',
                width: '100%',
                marginBottom: '1rem',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid #eee'
              }}
              onClick={() => handlePlayVideo('3fumBcKC6RE')}
            >
              {playingVideo === '3fumBcKC6RE' ? (
                <iframe
                  src="https://www.youtube.com/embed/3fumBcKC6RE?autoplay=1"
                  allowFullScreen
                  style={{ width: '100%', height: '180px', borderRadius: '8px', border: 'none' }}
                />
              ) : (
                <img 
                  src="https://img.youtube.com/vi/3fumBcKC6RE/0.jpg" 
                  alt="Video 3" 
                  style={{
                    width: '100%',
                    height: '120px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'block'
                  }}
                />
              )}
            </div>
          </div>
          
          <div style={{ maxWidth: '216px', marginBottom: '-16px', marginTop: '8px' }}>
            <input 
              type="text" 
              placeholder="🔍 Search for more articles..." 
              style={{
                padding: '8px 12px',
                width: '100%',
                fontSize: '0.85rem',
                border: '1px solid #ccc',
                borderRadius: '8px'
              }}
            />
          </div>

          <div style={{
            padding: '1rem',
            border: '1px solid #ccc',
            borderRadius: '8px',
            background: '#fff'
          }}>
            <h3 style={{
              fontSize: '1rem',
              color: '#0B4422',
              marginBottom: '0.5rem'
            }}>📚 More Articles</h3>
            <div style={{
              marginTop: '0.5rem',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              <a href="#" style={{
                display: 'block',
                marginBottom: '0.4rem',
                color: '#0B4422',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                textDecoration: 'none'
              }}>Dealing with Decision Fatigue</a>
              <span style={{
                display: 'block',
                fontSize: '0.75rem',
                color: '#444',
                marginBottom: '0.8rem'
              }}>Learn how to reduce emotional overload.</span>
              <a href="#" style={{
                display: 'block',
                marginBottom: '0.4rem',
                color: '#0B4422',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                textDecoration: 'none'
              }}>When Everything Feels Stuck</a>
              <span style={{
                display: 'block',
                fontSize: '0.75rem',
                color: '#444',
                marginBottom: '0.8rem'
              }}>Start by clarifying what you truly want.</span>
              <a href="#" style={{
                display: 'block',
                marginBottom: '0.4rem',
                color: '#0B4422',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                textDecoration: 'none'
              }}>Why Expectations Hurt</a>
              <span style={{
                display: 'block',
                fontSize: '0.75rem',
                color: '#444',
                marginBottom: '0.8rem'
              }}>Mapping emotional expectations can free you.</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 