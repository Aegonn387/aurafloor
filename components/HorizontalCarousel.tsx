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

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      const maxScrollLeft = scrollWidth - clientWidth;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < maxScrollLeft - 10);
      
      // Calculate current index
      const itemWidth = 336; // 320px + 16px gap
      const newIndex = Math.round(scrollLeft / itemWidth);
      setCurrentIndex(Math.min(newIndex, carouselItems.length - 1));
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 336; // Card width + gap
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
      const itemWidth = 336;
      scrollContainerRef.current.scrollTo({ 
        left: index * itemWidth, 
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

  // Auto-scroll every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollContainerRef.current && !isDragging) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        const maxScrollLeft = scrollWidth - clientWidth;
        const nextScroll = scrollLeft + 336 >= maxScrollLeft ? 0 : scrollLeft + 336;
        scrollContainerRef.current.scrollTo({ left: nextScroll, behavior: 'smooth' });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isDragging]);

  return (
    <div className="w-full relative">
      {/* Section Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-3">
          Discover Exclusive Content
        </h2>
        <p className="text-gray-300 text-lg">
          Swipe horizontally to explore {carouselItems.length} featured categories
        </p>
      </div>

      {/* Carousel Container */}
      <div className="relative group">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-gray-900/90 hover:bg-gray-800 text-white p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 hidden md:flex items-center justify-center"
            aria-label="Scroll left"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          className="flex overflow-x-auto scrollbar-hide space-x-4 pb-6 px-1 cursor-grab active:cursor-grabbing"
          style={{ 
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            scrollBehavior: 'smooth',
            scrollSnapType: 'x mandatory'
          }}
        >
          {carouselItems.map((item, index) => (
            <div
              key={item.id}
              className="flex-shrink-0 w-80 rounded-2xl overflow-hidden shadow-2xl transform transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl"
              style={{ scrollSnapAlign: 'start' }}
            >
              {/* Card with Gradient */}
              <div className={`h-56 ${item.gradient} p-7 flex flex-col justify-between relative overflow-hidden`}>
                {/* Animated background effect */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-5xl drop-shadow-lg">{item.icon}</span>
                    <span className="bg-black/40 backdrop-blur-md text-white text-sm font-bold px-4 py-1.5 rounded-full border border-white/20">
                      {item.category}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3 leading-tight drop-shadow-lg">
                    {item.title}
                  </h3>
                </div>
                <p className="text-white/95 text-base relative z-10 font-medium">
                  {item.description}
                </p>
              </div>

              {/* Card Footer with Button */}
              <div className="bg-gray-900 p-5 border-t border-gray-800">
                <a
                  href={item.actionLink}
                  className="inline-flex items-center justify-center w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-3.5 px-6 rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg hover:shadow-xl"
                >
                  <span>{item.actionText}</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-gray-900/90 hover:bg-gray-800 text-white p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 hidden md:flex items-center justify-center"
            aria-label="Scroll right"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Scroll Indicators */}
      <div className="mt-8 space-y-6">
        {/* Progress bar */}
        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300"
            style={{ 
              width: `${((currentIndex + 1) / carouselItems.length) * 100}%` 
            }}
          />
        </div>

        {/* Dots Navigation */}
        <div className="flex justify-center items-center space-x-4">
          <button 
            onClick={() => scroll('left')}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Previous"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex space-x-3">
            {carouselItems.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 w-8' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <button 
            onClick={() => scroll('right')}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Next"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Counter */}
        <div className="text-center text-gray-400 text-sm">
          <span className="text-white font-bold text-lg">{currentIndex + 1}</span>
          <span className="mx-2">/</span>
          <span>{carouselItems.length}</span>
          <span className="ml-3">• Swipe or use arrows • Auto-scrolls every 5s</span>
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
      `}</style>
    </div>
  );
}
