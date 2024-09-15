import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { fetchPostBySlug } from '../../app/services/api';
import Link from 'next/link';
import axios from 'axios';
import { FaEye, FaCalendarAlt, FaClock, FaShare, FaHeart, FaBookmark, FaClipboard } from 'react-icons/fa';
import { AiOutlineComment } from 'react-icons/ai';
import { SiFacebook, SiTwitter, SiWhatsapp } from 'react-icons/si';
import Head from 'next/head';
import '../../app/styles/posts.css';
import CommentsModal from './CommentsModal';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PostPage = ({ post }) => {
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [isLikedByUser, setIsLikedByUser] = useState(post.isLikedByUser || false);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked || false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState(post.relatedPosts || []);
  const [topViewedPosts, setTopViewedPosts] = useState(post.topViewedPosts || []);
  
  const router = useRouter();
  const { post_slug } = router.query;

  // Function to update like status
  const toggleLike = async () => {
    try {
      const loggedInUser = localStorage.getItem('user');
      if (!loggedInUser) {
        toast.error("Please log in to like the post");
        return;
      }

      const foundUser = JSON.parse(loggedInUser);
      const userId = foundUser.id;

      await axios.post(`https://blog.tourismofkashmir.com/api_likes?toggle-like`, { post_id: post.id, user_id: userId });

      setIsLikedByUser(prev => !prev);
      setLikeCount(prevCount => (isLikedByUser ? prevCount - 1 : prevCount + 1));
      document.getElementById('like-btn').classList.add('heartBeatAnimation');

      setTimeout(() => {
        document.getElementById('like-btn').classList.remove('heartBeatAnimation');
      }, 500);
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  // Function to handle bookmark toggle
  const handleBookmarkClick = async () => {
    const loggedInUser = localStorage.getItem('user');
    if (!loggedInUser) {
      toast.error("Please log in to manage bookmarks");
      return;
    }

    const foundUser = JSON.parse(loggedInUser);
    const userId = foundUser.id;

    const action = isBookmarked ? 'delete' : 'add';

    try {
      await axios.get(`https://blog.tourismofkashmir.com/api_bookmark.php?action=${action}&user_id=${userId}&post_id=${post.id}`);
      setIsBookmarked(prev => !prev);
      toast.success(action === 'add' ? "Bookmark added successfully" : "Bookmark removed successfully");
    } catch (error) {
      console.error(`Error ${action}ing bookmark:`, error);
      toast.error(`Error ${action}ing bookmark: ${error.message}`);
    }
  };

  // Function to toggle share options modal
  const toggleShareOptions = () => {
    setShowShareOptions(prev => !prev);
  };

  // Function to share on social media
  const shareOnSocialMedia = (platform) => {
    const url = window.location.href;
    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${url}`;
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${url}`;
        break;
      default:
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  };

  // Function to copy link to clipboard
  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => toast.success("Link copied to clipboard!"))
      .catch((err) => console.error("Could not copy link: ", err));
  };

  // Function to toggle comments modal
  const toggleCommentsModal = () => {
    setShowComments(prevState => !prevState);
  };

  // Helper function to truncate titles that are too long
  const truncateTitle = (title, maxLength = 50) => {
    return title.length > maxLength ? `${title.substring(0, maxLength)}...` : title;
  };

  const getCurrentDomain = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'https://yourwebsite.com'; // Fallback for server-side rendering
  };

  const currentDomain = getCurrentDomain();
  const postUrl = post ? `${currentDomain}/posts/${post.slug}` : '';
  const defaultImage = `${currentDomain}/default-image.jpg`; // Replace with your default image URL
  const imageUrl = post && post.image ? post.image : defaultImage;

  if (!post) {
    return (
      <div className="news-detail-skeleton-wrapper">
        <div className="news-detail-skeleton-image"></div>
        <div className="news-detail-skeleton-title"></div>
        <div className="news-detail-skeleton-meta"></div>
        <div className="news-detail-skeleton-content"></div>
      </div>
    );
  }

  const formattedDate = new Date(post.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formatViews = (views) => {
    if (views >= 10000000) {
      return Math.floor(views / 10000000) + 'cr';
    } else if (views >= 1000000) {
      return Math.floor(views / 1000000) + 'M';
    } else if (views >= 100000) {
      return Math.floor(views / 100000) + 'L';
    } else if (views >= 1000) {
      return Math.floor(views / 1000) + 'k';
    } else {
      return views.toString();
    }
  };

  return (
    <>
      <Head>
        <title>{post.title}</title>
        <meta name="description" content={post ? post.meta_description : 'Post not found'} />
        <meta property="og:title" content={post ? post.title : 'Post Not Found'} />
        <meta property="og:description" content={post ? post.meta_description : 'Post not found'} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:url" content={postUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Your Website Name" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post ? post.title : 'Post Not Found'} />
        <meta name="twitter:description" content={post ? post.meta_description : 'Post not found'} />
        <meta name="twitter:image" content={imageUrl} />
        <meta name="twitter:url" content={postUrl} />
        <link rel="icon" href={imageUrl} type="image/x-icon" />
      </Head>

      <div className="container_post">
        <div className="card_post">
          <img src={post.image} className="card-img-top news-image" alt={post.title} />
          <div className="card-body">
            <h5 className="card-title">{post.title}</h5>
            <p className="card-text post-meta">
              <FaEye /> {formatViews(post.views)} views •
              <FaCalendarAlt /> {formattedDate} •
              <FaClock /> {post.read_time} min read
            </p>
            <div className="content_post" dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
        </div>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <div className="related-posts">
            <h2>Also Read</h2>
            <div className="related-posts-container">
              {relatedPosts.map((relatedPost, index) => (
                <div className="related-post-card" key={index}>
                  <Link href={`/${post.category_name}/${relatedPost.slug}`}>
                    <div className="image-container">
                      <img src={relatedPost.image} alt={relatedPost.title} />
                      <div className="related_read-time-overlay">{relatedPost.read_time} min read</div>
                    </div>
                    <div className="post-details">
                      <h3 className="post-title">{truncateTitle(relatedPost.title)}</h3>
                      <p className="post-excerpt">{relatedPost.excerpt}</p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="post-category">
          <strong>Category:</strong> {post.category_name}
        </div>
        <div className='tags-div'>
          {post.tag_slugs && (
            <div className="post-tags">
              <strong>Tags:</strong>
              {post.tag_slugs.split(',').map((tagSlug, index) => (
                <Link href={`/tags/${tagSlug}`} key={index} className="tag-link">
                  <span className="tag">
                    {post.tag_names.split(',')[index].trim()}{index < post.tag_slugs.split(',').length - 1 ? ', ' : ''}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="actions">
        <div className="action-item" onClick={toggleLike}>
          <FaHeart style={{ color: isLikedByUser ? 'red' : 'inherit' }} />
        </div>
        <span id="like-count">{likeCount}</span>
        <div className="action-item" onClick={toggleCommentsModal}>
          <AiOutlineComment />
        </div>
        <span id="comment-count">{commentCount}</span>
        <div className="action-item" onClick={handleBookmarkClick}>
          {isBookmarked ? (
            <FaBookmark style={{ color: 'gold' }} />
          ) : (
            <FaBookmark />
          )}
        </div>
        <div className="action-item" onClick={toggleShareOptions}>
          <FaShare />
        </div>
      </div>

      {showShareOptions && (
        <div className="modal-backdrop" onClick={() => setShowShareOptions(false)}>
          <div className="share-options-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Share this post</h2>
            <div className="share-option" onClick={() => shareOnSocialMedia('facebook')}>
              <SiFacebook className="share-option-icon" /> Share on Facebook
            </div>
            <div className="share-option" onClick={() => shareOnSocialMedia('twitter')}>
              <SiTwitter className="share-option-icon" /> Share on Twitter
            </div>
            <div className="share-option" onClick={() => shareOnSocialMedia('whatsapp')}>
              <SiWhatsapp className="share-option-icon" /> Share on WhatsApp
            </div>
            <div className="share-option" onClick={copyLinkToClipboard}>
              <FaClipboard className="share-option-icon" /> Copy Link
            </div>
          </div>
        </div>
      )}

      <CommentsModal isOpen={showComments} onClose={toggleCommentsModal} postId={post.id} />

      {topViewedPosts.length > 0 && (
        <div className="you-might-like outside-container">
          <h2>You Might Like</h2>
          <div className="top-viewed-posts-container">
            {topViewedPosts.map((topViewedPost, index) => (
              <div className="top-viewed-post-card" key={index}>
                <Link href={`/${topViewedPost.category_slug}/${topViewedPost.slug}`} className="card-link">
                  <div className="image-container">
                    <img src={topViewedPost.image} alt={topViewedPost.title} className="top-viewed-post-image" />
                    <div className="read-time-overlay">{topViewedPost.read_time} min read</div>
                  </div>
                  <div className="text-container">
                    <h3 className="top-viewed-post-title">{truncateTitle(topViewedPost.title)}</h3>
                    <p className="top-viewed-post-category">{topViewedPost.category_name}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export async function getServerSideProps({ params }) {
  const { post_slug } = params;

  try {
    // Fetch the post based on the slug from params
    const post = await fetchPostBySlug(post_slug);

    // Fetch additional data here if needed (likes, comments, etc.)
    // Example:
    const likeCountResponse = await axios.get(`https://blog.tourismofkashmir.com/api_likes?action=getLikeCount&post_id=${post.id}`);
    const commentCountResponse = await axios.get(`https://blog.tourismofkashmir.com/api_comment_count.php?post_id=${post.id}`);
    const relatedPostsResponse = await axios.get(`https://blog.tourismofkashmir.com/related_api.php?related_posts=${post.category_name}&exclude_post_id=${post.id}`);
    const topViewedPostsResponse = await axios.get(`https://blog.tourismofkashmir.com/related_api.php?topviewpost=true&exclude_post_id=${post.id}`);

    return {
      props: { 
        post: {
          ...post,
          likeCount: likeCountResponse.data.like_count,
          commentCount: commentCountResponse.data.comment_count,
          relatedPosts: relatedPostsResponse.data,
          topViewedPosts: topViewedPostsResponse.data,
          isLikedByUser: false, // Replace with logic to check if user liked the post
          isBookmarked: false // Replace with logic to check if user bookmarked the post
        }
      }
    };
  } catch (error) {
    console.error('Error fetching post:', error);

    return {
      props: { 
        post: null // Return null if there's an error
      }
    };
  }
}

export default PostPage;
