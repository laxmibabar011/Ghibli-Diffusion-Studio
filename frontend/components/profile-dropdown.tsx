"use client"

import type React from "react"
import { useRouter } from "next/navigation"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Mail, LogOut, Edit, Upload } from "lucide-react"

interface UserProfile {
    firstName: string
    lastName: string
    email: string
    photoUrl?: string
    dob: string
}

export function ProfileDropdown() {
    const [user, setUser] = useState<UserProfile>({
        firstName: "",
        lastName: "",
        email: "",
        photoUrl: "",
        dob: "",
    })

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem("token")
            if (!token) return

            try {
                const res = await fetch("http://localhost:8000/users/me", {
                    headers: { "Authorization": `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setUser({
                        firstName: data.first_name || "",
                        lastName: data.last_name || "",
                        email: data.email || "",
                        dob: data.dob || "",
                        photoUrl: data.profile_image_url || "/anime-artist.jpg"
                    })
                }
            } catch (err) {
                console.error("Failed to fetch user profile")
            }
        }
        fetchUser()
    }, [])

    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editForm, setEditForm] = useState<UserProfile>(user)
    const [imagePreview, setImagePreview] = useState<string | null>(null)

    const router = useRouter()

    const handleLogout = () => {
        localStorage.removeItem("token")
        router.replace("/login")
    }

    const handleEditProfile = () => {
        setEditForm(user)
        setImagePreview(null)
        setIsEditOpen(true)
    }

    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const handleSaveChanges = async () => {
        const token = localStorage.getItem("token")
        if (!token) return

        let newPhotoUrl = editForm.photoUrl

        // Upload Image if selected
        if (selectedFile) {
            const formData = new FormData()
            formData.append("file", selectedFile)

            try {
                const res = await fetch("http://localhost:8000/users/me/avatar", {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` },
                    body: formData
                })
                if (res.ok) {
                    const data = await res.json()
                    newPhotoUrl = data.url
                }
            } catch (err) {
                console.error("Failed to upload avatar", err)
            }
        }

        // We can add updating other profile fields here later if needed (backend endpoint required for PUT /users/me)
        // For now, we update local state with the new image URL

        setUser({
            ...editForm,
            photoUrl: newPhotoUrl,
        })
        setIsEditOpen(false)
        setSelectedFile(null)
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const initials = `${user.firstName[0]}${user.lastName[0]}`

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full transition-transform hover:scale-105">
                        <Avatar className="h-10 w-10 border-2 border-primary/20">
                            <AvatarImage src={user.photoUrl || "/placeholder.svg"} alt={`${user.firstName} ${user.lastName}`} />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 p-4" align="end">
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex items-start gap-4 mb-2">
                            <Avatar className="h-16 w-16 border-2 border-primary/20">
                                <AvatarImage src={user.photoUrl || "/placeholder.svg"} alt={`${user.firstName} ${user.lastName}`} />
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">{initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col gap-1">
                                <p className="text-lg font-semibold text-foreground">
                                    {user.firstName} {user.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground font-normal">Artist & Creator</p>
                            </div>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="py-2 space-y-2">
                        <div className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/50 transition-colors">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">Email</span>
                                <span className="text-sm">{user.email}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/50 transition-colors">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">Date of Birth</span>
                                <span className="text-sm">{user.dob ? new Date(user.dob).toLocaleDateString() : "Not set"}</span>
                            </div>
                        </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer" onClick={handleEditProfile}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                        onClick={handleLogout}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                        <DialogDescription>Update your profile information</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        {/* Photo Upload */}
                        <div className="flex flex-col items-center gap-4">
                            <Avatar className="h-24 w-24 border-2 border-primary/20">
                                <AvatarImage
                                    src={imagePreview || editForm.photoUrl || "/placeholder.svg"}
                                    alt={`${editForm.firstName} ${editForm.lastName}`}
                                />
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-2xl">
                                    {editForm.firstName[0]}
                                    {editForm.lastName[0]}
                                </AvatarFallback>
                            </Avatar>
                            <Label htmlFor="photo-upload" className="cursor-pointer">
                                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-md transition-colors">
                                    <Upload className="h-4 w-4" />
                                    <span className="text-sm">Upload Photo</span>
                                </div>
                                <Input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            </Label>
                        </div>

                        {/* Form Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    value={editForm.firstName}
                                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    value={editForm.lastName}
                                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dob">Date of Birth</Label>
                            <Input
                                id="dob"
                                type="date"
                                value={editForm.dob}
                                onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveChanges}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
