import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDate } from "../utils/DateFormat";
import useUserStore from "../stores/useUserStore";
import PostMedia from "./PostMedia";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { useCallback } from "react";
import usePostStore from "../stores/usePostStore";
import { MyContext } from "../Context/MyContext";
import { toast } from "react-toastify";
import useSocketStore from "../stores/useSocketStore";
import useCommentStore from "../stores/useCommentStore";

const ThreadPost = ({ postAuthor = null, post, isCommentPage = false }) => {
  const user = useUserStore((state) => state.user);
  const [liked, setLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likes_count || 0);
  const [isOpen3dotMenu, setIsOpen3dotMenu] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments_count || 0);

  const { saveLike, deletePost } = usePostStore();
  const { mainSocket } = useSocketStore();
  const { addCommentState } = useCommentStore();

  const { setIsShowLoginNavigator } = useContext(MyContext);
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const axiosPrivate = useAxiosPrivate();

  const usersCache = useUserStore((state) => state.usersCache);
  const author = postAuthor || usersCache[post.user_id] || user;

  const updatePostLikes = (data) => {
    setLikeCount(data.likes_count);
  };

  const receiveNewComment = (comment) => {
    if (post.id.toString() === comment.post_id.toString()) {
      if (user?.id !== comment.user_id) addCommentState(comment);
    }
    setCommentCount((prev) => prev + 1);
  };

  useEffect(() => {
    if (mainSocket && post.id && isCommentPage) {
      mainSocket.emit("join_postRoom", post.id);
      mainSocket?.on("update_post_likes", updatePostLikes);
      mainSocket?.on("receive_new_comment", receiveNewComment);
    }

    return () => {
      mainSocket?.off("update_post_likes", updatePostLikes);
      mainSocket?.off("receive_new_comment", receiveNewComment);
      if (mainSocket && post.id && isCommentPage) {
        mainSocket.emit("leave_postRoom", post.id);
      }
    };
  }, [post?.id, mainSocket, isCommentPage]);

  const handleLike = useCallback(async () => {
    if (!user) {
      setIsShowLoginNavigator(true);
      return;
    }
    try {
      const res = await saveLike(post.id, axiosPrivate);
      setLiked(res.liked || false);
      setLikeCount(res.likes_count);
    } catch (error) {
      console.error(error);
      toast.error(error.response.data.message || error);
      if (error.response?.status === 404) {
        window.location.reload();
      }
    }
  }, [user, post.id]);

  const copyWithFallback = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();

    try {
      const copied = document.execCommand("copy");
      if (!copied) throw new Error("Copy command was rejected");
    } finally {
      document.body.removeChild(textArea);
    }
  };

  const handleCopyLink = async () => {
    const postLink = new URL(
      `/post/${post.id}/comments`,
      window.location.origin
    ).toString();

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(postLink);
      } else {
        copyWithFallback(postLink);
      }

      setIsOpen3dotMenu(false);
      toast.success("Post link copied to clipboard!");
    } catch (error) {
      console.error("Could not copy post link:", error);
      toast.error("Could not copy the post link.");
    }
  };

  const handleDeletePost = async () => {
    await deletePost(post.id, axiosPrivate);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen3dotMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <article className="px-4 py-4 hover:bg-gray-50 transition bg-white">
      <div className="flex gap-3">
        <div className="flex flex-col items-center flex-shrink-0">
          {author?.avatar_url ? (
            <div
              className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex-shrink-0 overflow-hidden cursor-pointer"
              onClick={() => navigate(`/profile/${author?.username}`)}
            >
              <img
                src={author?.avatar_url}
                alt=""
                className="size-full object-cover"
              />
            </div>
          ) : (
            <div className="relative overflow-hidden bg-gray-300 rounded-full size-10 flex justify-center items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="180px"
                viewBox="0 -960 960 960"
                width="180px"
                fill="#797979ff"
                className="absolute top-2 size-full"
              >
                <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Z" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col">
              <span className="font-semibold text-[15px]">
                {author?.username || "username"}
              </span>
              <span className="text-gray-500 text-xs">
                {formatDate(post.created_at)}
              </span>
            </div>
            <button
              className="p-1 hover:bg-gray-200 rounded-lg relative"
              ref={menuRef}
              onClick={() => setIsOpen3dotMenu(!isOpen3dotMenu)}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
              {isOpen3dotMenu && (
                <div className="absolute top-8 right-0 bg-white border border-gray-200 rounded-lg shadow-lg w-40 z-10 overflow-hidden">
                  <ul className="flex flex-col">
                    <li
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={handleCopyLink}
                    >
                      Copy Post Link
                    </li>
                    {post.user_id === user?.id && (
                      <li
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={handleDeletePost}
                      >
                        Delete Post
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </button>
          </div>

          <p className="text-[15px] mb-3 whitespace-pre-line">{post.content}</p>

          {/* Media Display */}
          <div className="">
            <PostMedia media={post.media} />
          </div>

          <div className="flex items-center gap-5 mt-3">
            <button
              onClick={handleLike}
              className="flex items-center gap-2 hover:opacity-70 transition group"
            >
              <svg
                className={`w-5 h-5 ${
                  liked ? "fill-red-500 text-red-500" : "text-gray-700"
                } group-hover:scale-110 transition-transform`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {likeCount > 0 && (
                <span className="text-gray-600 text-sm">{likeCount}</span>
              )}
            </button>

            <button
              onClick={() => navigate(`/post/${post.id}/comments`)}
              className="flex items-center gap-2 hover:opacity-70 transition group"
            >
              <svg
                className="w-5 h-5 text-gray-700 group-hover:scale-110 transition-transform"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {commentCount > 0 && (
                <span className="text-gray-600 text-sm">{commentCount}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default ThreadPost;
