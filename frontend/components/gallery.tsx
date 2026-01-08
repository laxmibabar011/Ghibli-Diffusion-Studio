"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Download } from "lucide-react"
import type { GeneratedImage } from "@/types"
import { useState } from "react"

interface GalleryProps {
    images: GeneratedImage[]
    onClose: () => void
}

export function Gallery({ images, onClose }: GalleryProps) {
    const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null)

    const downloadImage = (url: string, prompt: string) => {
        const link = document.createElement("a")
        link.href = url
        link.download = `${prompt.slice(0, 20)}.png`
        link.click()
    }

    const formatDateTime = (timestamp: Date | string) => {
        const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
        return {
            date: date.toLocaleDateString(),
            time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
    }

    return (
        <div className="flex-1 flex flex-col bg-background h-full overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between flex-shrink-0">
                <h2 className="text-2xl font-bold">Gallery</h2>
                <Button variant="ghost" size="icon" onClick={onClose} className="hover:scale-110 transition-transform">
                    <X className="h-5 w-5" />
                </Button>
            </div>

            {/* Gallery Grid */}
            <div className="flex-1 min-h-0 relative">
                <ScrollArea className="h-full p-6">
                    {images.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center space-y-4 animate-in fade-in duration-500">
                                <div className="text-6xl">🖼️</div>
                                <h3 className="text-xl font-semibold">No images yet</h3>
                                <p className="text-muted-foreground">Generate some images to see them here</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                            {images.map((image, index) => {
                                const { date, time } = formatDateTime(image.timestamp)
                                return (
                                    <div
                                        key={image.id}
                                        className="group relative rounded-xl overflow-hidden bg-card border border-border shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer animate-in fade-in zoom-in"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                        onClick={() => setSelectedImage(image)}
                                    >
                                        <div className="aspect-square overflow-hidden">
                                            <img
                                                src={image.url || "/placeholder.svg"}
                                                alt={image.prompt}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-300"
                                            />
                                        </div>
                                        <div className="p-4 space-y-2">
                                            <p className="text-sm line-clamp-2 leading-relaxed">{image.prompt}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {date} at {time}
                                            </p>
                                        </div>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                downloadImage(image.url, image.prompt)
                                            }}
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 animate-in fade-in duration-200"
                    onClick={() => setSelectedImage(null)}
                >
                    <div
                        className="max-w-5xl w-full bg-card rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <h3 className="font-semibold line-clamp-1">{selectedImage.prompt}</h3>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedImage(null)}
                                className="hover:scale-110 transition-transform"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="p-6">
                            <img
                                src={selectedImage.url || "/placeholder.svg"}
                                alt={selectedImage.prompt}
                                className="w-full h-auto rounded-lg"
                            />
                        </div>
                        <div className="p-4 border-t border-border flex justify-end">
                            <Button onClick={() => downloadImage(selectedImage.url, selectedImage.prompt)}>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
