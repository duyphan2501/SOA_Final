import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Comment from "../components/Comment";
import usePostStore from "../stores/usePostStore";
import useUserStore from "../stores/useUserStore";
import useCommentStore from "../stores/useCommentStore";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { toast } from "react-toastify";
import { MyContext } from "../Context/MyContext";
import ThreadPost from "../components/ThreadPost";

const CommentPage = () => {
  const navigate = useNavigate();
  const { postId } = useParams();

  useEffect(() => {
    if (!postId) navigate("/");
  }, [postId, navigate]);

  const getPost = usePostStore((state) => state.getPost);
  const { fetchUserIfNeeded } = useUserStore();
  const {
    getPostComments,
    addComment,
    setComments,
    addCommentState,
    replaceTempComment,
    removeCommentById,
  } = useCommentStore();
  const user = useUserStore((state) => state.user);
  const { setIsShowLoginNavigator } = useContext(MyContext);

  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const comments = useCommentStore((state) => state.comments);

  const [replyingTo, setReplyingTo] = useState(null);
  const [commentText, setCommentText] = useState("");

  const [visibleCount, setVisibleCount] = useState(5);
  const loadMoreRef = useRef(null);
  const fetchRequestRef = useRef(0);
  const axiosPrivate = useAxiosPrivate();

  const fetchPostData = useCallback(async () => {
    if (!postId) return;

    const requestId = ++fetchRequestRef.current;
    setIsLoading(true);
    setLoadError(null);
    setPost(null);
    setComments([]);

    try {
      const [resPost, resComments] = await Promise.all([
        getPost(postId),
        getPostComments(postId),
      ]);

      const author = await fetchUserIfNeeded(resPost.user_id);
      if (requestId !== fetchRequestRef.current) return;

      const finalPost = { ...resPost, author };
      setComments(resComments);
      setPost(finalPost);
    } catch (error) {
      if (requestId !== fetchRequestRef.current) return;

      console.error("Failed to fetch post data:", error);
      setLoadError(
        error.response?.data?.message || "Post is deleted or does not exist."
      );
    } finally {
      if (requestId === fetchRequestRef.current) {
        setIsLoading(false);
      }
    }
  }, [
    postId,
    getPost,
    getPostComments,
    fetchUserIfNeeded,
    setComments,
  ]);

  useEffect(() => {
    fetchPostData();

    return () => {
      fetchRequestRef.current += 1;
    };
  }, [fetchPostData]);

  const handleReply = useCallback(
    (commentId) => {
      if (!user) {
        setIsShowLoginNavigator(true);
        return;
      }
      if (replyingTo !== commentId) {
        setReplyingTo(commentId);
      }
    },
    [replyingTo, setIsShowLoginNavigator, user]
  );

  // Helper function moved outside the component body or into a util file
  const buildCommentTree = (commentsArr) => {
    if (!commentsArr) return [];
    const commentMap = {};
    const rootComments = [];

    commentsArr.forEach((comment) => {
      commentMap[comment.id] = { ...comment, replies: [] };
    });

    commentsArr.forEach((comment) => {
      if (comment.parent_comment_id === null) {
        rootComments.push(commentMap[comment.id]);
      } else if (commentMap[comment.parent_comment_id]) {
        commentMap[comment.parent_comment_id].replies.push(
          commentMap[comment.id]
        );
      }
    });
    return rootComments;
  };

  const commentTree = useMemo(() => buildCommentTree(comments), [comments]);
  const level0Comments = useMemo(
    () => commentTree.slice(0, visibleCount),
    [commentTree, visibleCount]
  );

  useEffect(() => {
    if (!loadMoreRef.current) return;
    const option = {
      root: null,
      rootMargin: "0px",
      threshold: 0.9,
    };
    const observer = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting) {
        setVisibleCount((prev) => {
          const next = prev + 10;
          // Nếu hết comment thì ngừng tăng
          return next > commentTree.length ? commentTree.length : next;
        });
      }
    }, option);

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [commentTree]);

  const handleSubmitComment = async (content) => {
    if (!content.trim() || !post) return;

    // In a real app, this data would go to an API via the store
    const tempCommentId = `temp_${Date.now()}`;
    const newCommentData = {
      id: tempCommentId,
      user_id: user?.id,
      created_at: new Date().toISOString(),
      post_id: post.id,
      parent_comment_id: replyingTo || null,
      content: content,
    };
    // update UI immediately
    addCommentState(newCommentData);

    try {
      const addedCommentFromServer = await addComment(
        newCommentData.post_id,
        newCommentData.parent_comment_id,
        newCommentData.content,
        axiosPrivate
      );
      replaceTempComment(tempCommentId, addedCommentFromServer);
      setCommentText("");
      setReplyingTo(null);
    } catch (error) {
      removeCommentById(tempCommentId);
      console.error(error);
      toast.error(
        error.response?.data?.message || "Failed to submit comment:",
        error
      );
      if (error.response?.status === 404) {
        window.location.reload();
      }
    }
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-screen text-xl font-black">
        Loading...
      </div>
    );
  if (loadError || !post)
    return (
      <div className="flex items-center justify-center h-screen text-xl font-black">
        {loadError || "Post is deleted or does not exist."}
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto pt-4">
        {/* Inline Header */}
        <div className="bg-white rounded-t-2xl border border-gray-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center flex-grow">
            <h1 className="font-semibold text-base">Post</h1>
          </div>
          <button className="p-2 rounded-full -mr-2">
            <div className="w-5 h-5" />
          </button>
        </div>

        {/* Original Post - no tree line */}
        <div className="border-x border-b border-gray-200">
          <ThreadPost post={post} isCommentPage={true} />
        </div>

        {/* Comments Section */}
        <div className="bg-white border-x border-gray-200 px-4 pb-4 max-h-[500px] overflow-auto">
          <div className="space-y-6 pt-4">
            {level0Comments.length > 0 ? (
              level0Comments.map((comment, index) => (
                <Comment
                  key={comment.id}
                  comment={comment}
                  level={0}
                  onReply={handleReply}
                  showReplyInput={replyingTo}
                  isLast={index === level0Comments.length - 1}
                  hasMoreSiblings={index < level0Comments.length - 1}
                  onSubmit={handleSubmitComment}
                />
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No comments yet.
              </div>
            )}
          </div>
          {visibleCount < commentTree.length && (
            <div
              ref={loadMoreRef}
              className="h-8 flex justify-center items-center text-gray-400 text-sm"
            >
              Loading...
            </div>
          )}
        </div>

        {/* Comment Input - Separate rounded box at bottom */}
        <div className="bg-white rounded-b-2xl border border-gray-200 px-4 py-3 mb-4">
          <div className="flex gap-3 items-center">
            <div className="w-9 h-9 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
              <img
                src={user?.avatar_url}
                alt=""
                className="size-full object-cover"
              />
            </div>
            <input
              type="text"
              value={commentText}
              disabled={!user}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write comment..."
              className="flex-grow bg-gray-100 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) =>
                e.key === "Enter" && handleSubmitComment(commentText)
              }
            />
            <button
              onClick={handleSubmitComment}
              disabled={!commentText.trim()}
              className={`transition ${
                commentText.trim()
                  ? "text-blue-500 hover:text-blue-600"
                  : "text-gray-400"
              }`}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentPage;
