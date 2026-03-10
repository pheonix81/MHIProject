'use client';

import React, { useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { getUserIdForApi } from '@/lib/testUser';
import { Bookmark } from 'lucide-react';

export interface BookmarkButtonProps {
  rateId: string;
  isBookmarked?: boolean;
  onBookmarkChange?: (isBookmarked: boolean) => void;
  userId?: string;
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  rateId,
  isBookmarked = false,
  onBookmarkChange,
  userId,
}) => {
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [isLoading, setIsLoading] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [note, setNote] = useState('');

  const userIdForRequest = userId || (typeof window !== 'undefined' ? getUserIdForApi() : 'test-user');

  const handleBookmark = async () => {
    setIsLoading(true);

    try {
      if (bookmarked) {
        // Remove bookmark - for now, just toggle the UI
        // In a real app, you'd need to track bookmark IDs
        setBookmarked(false);
        onBookmarkChange?.(false);
      } else {
        // Add bookmark
        const response = await fetch(`${API_BASE_URL}/v1/bookmarks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': userIdForRequest || 'test-user',
          },
          body: JSON.stringify({
            rateId,
            notes: note || null,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to bookmark');
        }

        setBookmarked(true);
        setNote('');
        setShowNoteInput(false);
        onBookmarkChange?.(true);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to bookmark';
      console.error('Bookmark error:', errorMsg, error);
      alert(`Error: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => (bookmarked ? handleBookmark() : setShowNoteInput(true))}
        disabled={isLoading}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
          bookmarked
            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        } disabled:opacity-50`}
        title="Bookmark this item"
      >
        <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
        <span className="text-xs font-medium">
          {isLoading ? 'Saving...' : bookmarked ? 'Bookmarked' : 'Bookmark'}
        </span>
      </button>

      {showNoteInput && !bookmarked && (
        <div className="absolute top-full right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-3 w-48 z-50">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (optional)..."
            rows={2}
            className="w-full text-xs px-2 py-1 border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleBookmark}
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white text-xs py-1 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setShowNoteInput(false);
                setNote('');
              }}
              className="flex-1 bg-gray-200 text-gray-800 text-xs py-1 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
