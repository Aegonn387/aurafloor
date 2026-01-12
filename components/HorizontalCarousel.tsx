"use client";

import { useState, useRef, useEffect } from 'react';
import { carouselItems } from './carousel-data';

export default function HorizontalCarousel() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [cardWidth, setCardWidth] = useState(300); // Dynamic card width
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Set card width based on screen size
      if (window.innerWidth < 640) {
        setCardWidth(window.innerWidth * 0.85); // 85% of screen width on mobile
      } else if (window.innerWidth < 768) {
        setCardWidth(280);
      } else if (window.innerWidth < 1024) {
        setCardWidth(320);
      } else {
        setCardWidth(336);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      const maxScrollLeft = scrollWidth - clientWidth;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < maxScrollLeft - 10);

      // Calculate current index based on dynamic card width
      const gap = isMobile ? 12 : 16;
      const newIndex = Math.round(scrollLeft / (cardWidth + gap));
      setCurrentIndex(Math.min(newIndex, carouselItems.length - 1));
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const gap = isMobile ? 12 : 16;
      const scrollAmount = cardWidth + gap;
      const container = scrollContainerRef.current;
      const newScrollLeft = container.scrollLeft +
        (direction === 'left' ? -scrollAmount : scrollAmount);

      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const scrollToIndex = (index: number) => {
    if (scrollContainerRef.current) {
      const gap = isMobile ? 12 : 16;
      scrollContainerRef.current.scrollTo({
        left: index * (cardWidth + gap),
        behavior: 'smooth'
      });
    }
  };

  // Touch/swipe handling
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollContainerRef.current?.offsetLeft || 0));
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - (scrollContainerRef.current.offsetLeft || 0);
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  // Touch event handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - (scrollContainerRef.current?.offsetLeft || 0));
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    const x = e.touches[0].pageX - (scrollContainerRef.current.offsetLeft || 0);
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  // Auto-scroll every 5 seconds (disable on mobile for better UX)
  useEffect(() => {
    if (isMobile) return; // Disable auto-scroll on mobile
    
    const interval = setInterval(() => {
      if (scrollContainerRef.current && !isDragging) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        const maxScrollLeft = scrollWidth - clientWidth;
        const gap = 16;
        const nextScroll = scrollLeft + cardWidth + gap >= maxScrollLeft ? 0 : scrollLeft + cardWidth + gap;
        scrollContainerRef.current.scrollTo({ left: nextScroll, behavior: 'smooth' });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isDragging, cardWidth, isMobile]);

  return (
    <div className="w-full relative">
      {/* Section Header */}
      <div className="mb-4 sm:mb-6 md:mb-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-3">
          Discover Exclusive Content
        </h2>
        <p className="text-gray-300 text-sm sm:text-base md:text-lg">
          {isMobile ? 'Swipe to explore' : `Swipe horizontally to explore ${carouselItems.length} featured categories`}
        </p>
      </div>

      {/* Carousel Container */}
      <div className="relative group">
        {/* Left Arrow - Show on all screens */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-gray-900/90 hover:bg-gray-800 text-white p-2 sm:p-3 md:p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center"
            aria-label="Scroll left"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Scrollable Carousel */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseLeave={() => setIsDragging(false)}
          onMouseUp={() => setIsDragging(false)}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchEnd={() => setIsDragging(false)}
          onTouchMove={handleTouchMove}
          className="flex overflow-x-auto scrollbar-hide space-x-3 sm:space-x-4 pb-4 sm:pb-6 px-1 cursor-grab active:cursor-grabbing touch-scroll"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            scrollBehavior: 'smooth',
            scrollSnapType: isMobile ? 'x mandatory' : 'none'
          }}
        >
          {carouselItems.map((item, index) => (
            <div
              key={item.id}
              className="flex-shrink-0 w-[85vw] sm:w-64 md:w-80 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg sm:shadow-2xl transform transition-all duration-300 hover:scale-[1.02] sm:hover:scale-[1.03] hover:shadow-xl sm:hover:shadow-2xl"
              style={{ 
                scrollSnapAlign: isMobile ? 'start' : 'none',
                minWidth: isMobile ? '85vw' : undefined 
              }}
            >
              {/* Card with Gradient */}
              <div className={`h-40 sm:h-48 md:h-56 ${item.gradient} p-4 sm:p-5 md:p-7 flex flex-col justify-between relative overflow-hidden`}>
                {/* Animated background effect */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute -top-6 -right-6 sm:-top-10 sm:-right-10 w-24 h-24 sm:w-40 sm:h-40 bg-white rounded-full blur-2xl sm:blur-3xl"></div>
                </div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <span className="text-3xl sm:text-4xl md:text-5xl drop-shadow-lg">{item.icon}</span>
                    <span className="bg-black/40 backdrop-blur-md text-white text-xs sm:text-sm font-bold px-3 py-1 sm:px-4 sm:py-1.5 rounded-full border border-white/20">
                      {item.category}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 sm:mb-3 leading-tight drop-shadow-lg">
                    {item.title}
                  </h3>
                </div>
                <p className="text-white/95 text-sm sm:text-base relative z-10 font-medium line-clamp-2">
                  {item.description}
                </p>
              </div>

              {/* Card Footer with Button */}
              <div className="bg-gray-900 p-3 sm:p-4 md:p-5 border-t border-gray-800">
                <a
                  href={item.actionLink}
                  className="inline-flex items-center justify-center w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-2.5 sm:py-3 md:py-3.5 px-4 sm:px-5 md:px-6 rounded-lg sm:rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 shadow-md sm:shadow-lg hover:shadow-xl text-sm sm:text-base"
                >
                  <span>{item.actionText}</span>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Right Arrow - Show on all screens */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-gray-900/90 hover:bg-gray-800 text-white p-2 sm:p-3 md:p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center"
            aria-label="Scroll right"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Scroll Indicators */}
      <div className="mt-4 sm:mt-6 md:mt-8 space-y-4 sm:space-y-6">
        {/* Progress bar */}
        <div className="w-full bg-gray-800 rounded-full h-1.5 sm:h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / carouselItems.length) * 100}%`
            }}
          />
        </div>

        {/* Dots Navigation */}
        <div className="flex justify-center items-center space-x-3 sm:space-x-4">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Previous"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex space-x-2 sm:space-x-3">
            {carouselItems.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToIndex(index)}
                className={`h-2 sm:h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 w-6 sm:w-8'
                    : 'bg-gray-700 hover:bg-gray-600 w-2 sm:w-3'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => scroll('right')}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Next"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Counter */}
        <div className="text-center text-gray-400 text-xs sm:text-sm">
          <span className="text-white font-bold text-base sm:text-lg">{currentIndex + 1}</span>
          <span className="mx-1 sm:mx-2">/</span>
          <span>{carouselItems.length}</span>
          {!isMobile && (
            <span className="ml-2 sm:ml-3 hidden sm:inline">• Swipe or use arrows • Auto-scrolls every 5s</span>
          )}
          {isMobile && (
            <span className="ml-2 block sm:hidden text-xs mt-1">Swipe to navigate</span>
          )}
        </div>
      </div>

      {/* Hide scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .touch-scroll {
          -webkit-overflow-scrolling: touch;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
