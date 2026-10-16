"use client";

import * as React from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Images, ChevronLeft, ChevronRight } from "lucide-react";

type PropertyGalleryProps = {
  propertyName: string;
  images: string[];
};

export function PropertyGallery({ propertyName, images }: PropertyGalleryProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = React.useState(0);

  const displayImages = images.slice(0, 5);

  const handleNextPhoto = () => {
    setActivePhotoIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevPhoto = () => {
    setActivePhotoIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <>
      {/* Sonder-inspired Editorial 5-photo Gallery */}
      <div className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-border/60 bg-muted/30">
        {/* Desktop 5-photo grid */}
        <div className="hidden h-[440px] grid-cols-4 gap-2.5 p-2.5 md:grid lg:h-[480px]">
          {/* Main Hero Photo (Left 2 columns) */}
          <div
            className="group relative col-span-2 h-full overflow-hidden rounded-xl cursor-pointer"
            onClick={() => {
              setActivePhotoIndex(0);
              setIsModalOpen(true);
            }}
          >
            <Image
              src={displayImages[0] || images[0]}
              alt={`${propertyName} - Main view`}
              fill
              priority
              sizes="(max-width: 1024px) 50vw, 600px"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/5 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>

          {/* 4 Supporting Photos (Right 2 columns, 2x2 grid) */}
          <div className="col-span-2 grid h-full grid-cols-2 gap-2.5">
            {displayImages.slice(1, 5).map((imgUrl, index) => (
              <div
                key={imgUrl}
                className="group relative h-full overflow-hidden rounded-xl cursor-pointer"
                onClick={() => {
                  setActivePhotoIndex(index + 1);
                  setIsModalOpen(true);
                }}
              >
                <Image
                  src={imgUrl}
                  alt={`${propertyName} - Photo ${index + 2}`}
                  fill
                  sizes="(max-width: 1024px) 25vw, 300px"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/5 opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Single Hero Photo with indicator */}
        <div
          className="relative h-72 w-full cursor-pointer md:hidden"
          onClick={() => {
            setActivePhotoIndex(0);
            setIsModalOpen(true);
          }}
        >
          <Image
            src={images[0]}
            alt={propertyName}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-xs">
            1 / {images.length}
          </div>
        </div>

        {/* View All Photos Pill Button */}
        <button
          type="button"
          onClick={() => {
            setActivePhotoIndex(0);
            setIsModalOpen(true);
          }}
          className="absolute bottom-5 right-5 hidden md:flex items-center gap-2 rounded-full border border-border/80 bg-surface/90 px-4 py-2 text-xs font-medium text-foreground shadow-md backdrop-blur-md transition-all hover:bg-surface hover:scale-105 active:scale-95"
        >
          <Images className="h-3.5 w-3.5" />
          <span>View all {images.length} photos</span>
        </button>
      </div>

      {/* Fullscreen Gallery Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl p-6 sm:p-8">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-lg font-medium">{propertyName}</DialogTitle>
            <p className="text-xs text-muted-foreground">
              Photo {activePhotoIndex + 1} of {images.length}
            </p>
          </DialogHeader>

          <div className="relative mt-2 aspect-16/10 w-full overflow-hidden rounded-xl bg-black/5">
            <Image
              src={images[activePhotoIndex]}
              alt={`${propertyName} - Photo ${activePhotoIndex + 1}`}
              fill
              className="object-contain"
            />

            {/* Navigation Arrows */}
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevPhoto}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-surface/80 shadow-md backdrop-blur-xs hover:bg-surface"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextPhoto}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-surface/80 shadow-md backdrop-blur-xs hover:bg-surface"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Thumbnail list */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {images.map((img, idx) => (
              <button
                key={img}
                type="button"
                onClick={() => setActivePhotoIndex(idx)}
                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                  idx === activePhotoIndex ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <Image src={img} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
