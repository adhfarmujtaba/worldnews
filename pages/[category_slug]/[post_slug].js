import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { fetchPostBySlug } from '../../app/services/api';
import Link from 'next/link';
import axios from 'axios';
import { FaEye, FaCalendarAlt, FaClock, FaShare, FaHeart, FaClipboard } from 'react-icons/fa';
import { AiOutlineComment } from 'react-icons/ai';
import { SiFacebook, SiTwitter, SiWhatsapp } from 'react-icons/si';
import { FaBookmark as BookmarkIcon, FaBookmark as BookmarkedIcon } from 'react-icons/fa';
import Head from 'next/head';
import '../../app/styles/posts.css';
import CommentsModal from './CommentsModal';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PostPage = ({ post }) => {
  const [loading, setLoading] = useState(!post); // Show skeleton loader if post data is not passed from SSR
  const [likeCount, setLikeCount] = useState(0);
  const [isLikedByUser, setIsLikedByUser] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [topViewedPosts, setTopViewedPosts] = useState([]);

  const router = useRouter();
  const { post_slug } = router.query;

  useEffect(() => {
    const fetchPost = async () => {
      try {
        if (!post_slug) return;

        const postData = await fetchPostBySlug(post_slug);
        if (postData) {
          setPost(postData);
          setLoading(false); // Set loading to false when post data is fetched
        }
      } catch (error) {
        console.error("Error fetching post:", error);
        setLoading(false); // Ensure loading is set to false even on error
      }
    };

    if (post_slug) {
      fetchPost();
    }
  }, [post_slug]);

  useEffect(() => {
    const fetchLikes = async () => {
      try {
        const response = await axios.get(`https://blog.tourismofkashmir.com/api_likes?action=getLikeCount&post_id=${post.id}`);
        setLikeCount(response.data.like_count);

        const loggedInUser = localStorage.getItem('user');
        if (loggedInUser) {
          const foundUser = JSON.parse(loggedInUser);
          const userId = foundUser.id;

          const likeStatusResponse = await axios.get(`https://blog.tourismofkashmir.com/api_likes?action=checkUserLike&post_id=${post.id}&user_id=${userId}`);
          setIsLikedByUser(likeStatusResponse.data.user_liked);
        }
      } catch (error) {
        console.error("Error fetching like data:", error);
      }
    };

    if (post) {
      fetchLikes();
    }
  }, [post]);

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

      setIsLikedByUser(!isLikedByUser);
      setLikeCount(prevCount => isLikedByUser ? prevCount - 1 : prevCount + 1);
      document.getElementById('like-btn').classList.add('heartBeatAnimation');

      setTimeout(() => {
        document.getElementById('like-btn').classList.remove('heartBeatAnimation');
      }, 500);
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (post) {
        try {
          const loggedInUser = localStorage.getItem('user');
          if (!loggedInUser) {
            console.warn("User not logged in");
            setIsBookmarked(false);
            return;
          }

          const foundUser = JSON.parse(loggedInUser);
          const userId = foundUser.id;

          const response = await axios.get(`https://blog.tourismofkashmir.com/api_bookmark.php?action=check&user_id=${userId}&post_id=${post.id}`);
          if (response.data && typeof response.data === 'string') {
            setIsBookmarked(response.data.includes("Post is bookmarked"));
          } else {
            setIsBookmarked(false);
          }
        } catch (error) {
          console.error("Error checking bookmark status:", error);
          setIsBookmarked(false);
        }
      }
    };

    checkBookmarkStatus();
  }, [post]);

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
      setIsBookmarked(!isBookmarked);
      if (action === 'add') {
        toast.success("Bookmark added successfully");
      } else {
        toast.success("Bookmark removed successfully");
      }
    } catch (error) {
      console.error(`Error ${action}ing bookmark:`, error);
      toast.error(`Error ${action}ing bookmark: ${error.message}`);
    }
  };

  useEffect(() => {
    const fetchRelatedPosts = async () => {
      try {
        if (post && post.category_name) {
          const response = await axios.get(`https://blog.tourismofkashmir.com/related_api.php?related_posts=${post.category_name}&exclude_post_id=${post.id}`);
          setRelatedPosts(response.data);
        }
      } catch (error) {
        console.error("Error fetching related posts:", error);
      }
    };

    fetchRelatedPosts();
  }, [post]);

  useEffect(() => {
    const updateViews = async () => {
      try {
        await axios.get(`https://blog.tourismofkashmir.com/apis.php?update_views=true&post_id=${post.id}`);
      } catch (error) {
        console.error("Error updating post views:", error);
      }
    };

    if (post) {
      updateViews();
    }
  }, [post]);

  useEffect(() => {
    const fetchCommentCount = async () => {
      try {
        if (post) {
          const response = await axios.get(`https://blog.tourismofkashmir.com/api_comment_count.php?post_id=${post.id}`);
          setCommentCount(response.data.comment_count);
        }
      } catch (error) {
        console.error("Error fetching comment count:", error);
      }
    };

    fetchCommentCount();
  }, [post]);

  useEffect(() => {
    const fetchTopViewedPosts = async () => {
      try {
        if (post) {
          const response = await axios.get(`https://blog.tourismofkashmir.com/related_api.php?topviewpost=true&exclude_post_id=${post.id}`);
          setTopViewedPosts(response.data);
        }
      } catch (error) {
        console.error("Error fetching top viewed posts:", error);
      }
    };

    fetchTopViewedPosts();
  }, [post]);

  const toggleShareOptions = () => {
    setShowShareOptions(!showShareOptions);
  };

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

  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => toast.success("Link copied to clipboard!"))
      .catch((err) => console.error("Could not copy link: ", err));
  };

  if (loading) {
    return (
      <div className="news-detail-skeleton-wrapper">
        <div className="news-detail-skeleton-image"></div>
        <div className="news-detail-skeleton-title"></div>
        <div className="news-detail-skeleton-meta"></div>
        <div className="news-detail-skeleton-content"></div>
      </div>
    );
  }

  if (!post) {
    return <p>Post not found.</p>;
  }

  return (
    <>
      <Head>
        <title>{post.title}</title>
        <meta name="description" content={post.excerpt} />
        {/* Add other meta tags as needed */}
      </Head>
      <div className="post-page">
        <h1>{post.title}</h1>
        <div className="post-meta">
          <span><FaCalendarAlt /> {new Date(post.date).toLocaleDateString()}</span>
          <span><FaClock /> {post.reading_time} min read</span>
          <span><FaEye /> {post.views} views</span>
          <span><AiOutlineComment /> {commentCount} comments</span>
        </div>
        <div className="post-content" dangerouslySetInnerHTML={{ __html: post.content }} />
        <div className="post-actions">
          <button id="like-btn" onClick={toggleLike}>
            {isLikedByUser ? <FaHeart color="red" /> : <FaHeart />}
            {likeCount}
          </button>
          <button onClick={handleBookmarkClick}>
            {isBookmarked ? <BookmarkedIcon color="orange" /> : <BookmarkIcon />}
            {isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </button>
          <button onClick={toggleShareOptions}>
            <FaShare /> Share
          </button>
          {showShareOptions && (
            <div className="share-options">
              <button onClick={() => shareOnSocialMedia('facebook')}><SiFacebook /></button>
              <button onClick={() => shareOnSocialMedia('twitter')}><SiTwitter /></button>
              <button onClick={() => shareOnSocialMedia('whatsapp')}><SiWhatsapp /></button>
              <button onClick={copyLinkToClipboard}><FaClipboard /></button>
            </div>
          )}
        </div>
        <button onClick={() => setShowComments(!showComments)}>View Comments</button>
        {showComments && <CommentsModal postId={post.id} />}
        <div className="related-posts">
          <h2>Related Posts</h2>
          {relatedPosts.map(rp => (
            <div key={rp.id} className="related-post">
              <Link href={`/post/${rp.slug}`}>{rp.title}</Link>
            </div>
          ))}
        </div>
        <div className="top-viewed-posts">
          <h2>Top Viewed Posts</h2>
          {topViewedPosts.map(tp => (
            <div key={tp.id} className="top-viewed-post">
              <Link href={`/post/${tp.slug}`}>{tp.title}</Link>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default PostPage;

export async function getServerSideProps({ params }) {
  const { post_slug } = params;

  try {
    const post = await fetchPostBySlug(post_slug);
    return {
      props: { 
        post: post || null
      }
    };
  } catch (error) {
    console.error('Error fetching post:', error);
    return {
      props: { 
        post: null
      }
    };
  }
}