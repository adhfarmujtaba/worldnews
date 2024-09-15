import React, { useState, useEffect } from 'react';
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
  const [likeCount, setLikeCount] = useState(0);
  const [isLikedByUser, setIsLikedByUser] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [topViewedPosts, setTopViewedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minimumLoadTime, setMinimumLoadTime] = useState(0);

  const router = useRouter();
  const { post_slug } = router.query;

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postData = await fetchPostBySlug(post_slug);
        setPost(postData);
        setMinimumLoadTime(1000); // Set minimum load time to 1 second
      } catch (error) {
        console.error("Error fetching post:", error);
      }
    };

    if (post_slug) {
      fetchPost();
    }
  }, [post_slug]);

  useEffect(() => {
    if (post) {
      const timer = setTimeout(() => setLoading(false), minimumLoadTime);
      return () => clearTimeout(timer);
    }
  }, [post, minimumLoadTime]);

  useEffect(() => {
    if (!loading) {
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

      fetchLikes();
    }
  }, [post, loading]);

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
  }, [post, loading]);

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
  }, [post, loading]);

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
  }, [post, loading]);

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
  }, [post, loading]);

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
  }, [post, loading]);

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
    return <div>Post not found.</div>;
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

  const toggleCommentsModal = () => {
    setShowComments(prevState => !prevState);
  };

  const truncateTitle = (title, maxLength = 50) => {
    if (title.length > maxLength) {
      return `${title.substring(0, maxLength)}...`;
    }
    return title;
  };

  const getCurrentDomain = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'https://yourwebsite.com'; // Fallback for server-side rendering
  };

  const currentDomain = getCurrentDomain();
  const postUrl = post ? `${currentDomain}/posts/${post.slug}` : '';

  const defaultImage = `${currentDomain}/default-image.jpg`;
  const imageUrl = post && post.image ? post.image : defaultImage;

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
    const post = await fetchPostBySlug(post_slug);
    return {
      props: { post: post || null }
    };
  } catch (error) {
    console.error('Error fetching post:', error);
    return {
      props: { post: null }
    };
  }
}

export default PostPage;
