import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function CommentSection() {
  const navigate = useNavigate();
  const [newComment, setNewComment] = useState({
    content: "",
    userId: "",
    createdAt: Date.now(),
    upvotes: "",
    replies: [],
  });
  const [comments, setComments] = useState([]);
  const [user, setUser] = useState({
    _id: "",
    email: "",
  });
  const [replyContent, setReplyContent] = useState("");
  const [editCommentContent, setEditCommentContent] = useState("");
  const [editCommentId, setEditCommentId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      axios
        .post("http://localhost:3005/user/verify", {
          token: localStorage.getItem("token"),
        })
        .then(({ data }) => {
          if (data.userData._id) {
            console.log(data.userData);
            setUser(data.userData);
            axios
              .get("http://localhost:3005/comment/" + data.userData._id)
              .then(({ data }) => {
                console.log("user comments", data);
                setComments(data);
              });
          } else {
            navigate("/");
          }
        });
    } else {
      navigate("/");
    }
  }, []);

  const handleCommentChange = (event) => {
    const { name, value } = event.target;
    setNewComment((prevComment) => ({
      ...prevComment,
      [name]: value,
      userId: user._id,
    }));
  };

  const handleCommentSubmit = (event) => {
    event.preventDefault();
    console.log(newComment);

    axios
      .post("http://localhost:3005/comment", newComment)
      .then(() => {
        setNewComment({
          content: "",
          userId: "",
          createdAt: Date.now(),
          upvotes: "",
          replies: [],
        });
        // Fetch the updated comments after successful submission
        axios
          .get("http://localhost:3005/comment/" + user._id)
          .then(({ data }) => {
            console.log("user comments", data);
            setComments(data);
          })
          .catch((error) => {
            console.error("Error fetching comments:", error);
          });
      })
      .catch((error) => {
        console.error("Error sending comment data:", error);
      });
  };

  const handleCommentDelete = (commentId) => {
    axios
      .delete(`http://localhost:3005/comment/${commentId}`)
      .then(() => {
        setComments((prevComments) =>
          prevComments.filter((comment) => comment._id !== commentId)
        );
      })
      .catch((error) => {
        console.error("Error deleting comment:", error);
      });
  };

  const handleCommentEdit = (commentId, updatedContent) => {
    axios
      .put(`http://localhost:3005/comment/${commentId}`, {
        content: updatedContent,
      })
      .then(() => {
        // Fetch the updated comments after successful edit
        axios
          .get("http://localhost:3005/comment/" + user._id)
          .then(({ data }) => {
            console.log("user comments", data);
            setComments(data);
          })
          .catch((error) => {
            console.error("Error fetching comments:", error);
          });
      })
      .catch((error) => {
        console.error("Error updating comment:", error);
      });
  };

  const handleReply = (commentId) => {
    const reply = {
      content: replyContent,
      userId: user._id,
      createdAt: Date.now(),
    };

    axios
      .post(`http://localhost:3005/comment/${commentId}/reply`, reply)
      .then(() => {
        // Fetch the updated comments after successful reply
        axios
          .get("http://localhost:3005/comment/" + user._id)
          .then(({ data }) => {
            console.log("user comments", data);
            setComments(data);
          })
          .catch((error) => {
            console.error("Error fetching comments:", error);
          });
      })
      .catch((error) => {
        console.error("Error sending reply data:", error);
      });
  };

  return (
    <div>
      <h2>Comments</h2>
      <form onSubmit={handleCommentSubmit}>
        <label>
          Comment:
          <textarea
            name="content"
            value={newComment.content}
            onChange={handleCommentChange}
          />
        </label>
        <br />
        <button type="submit">Submit</button>
      </form>
      <div className="comment-section">
        {comments.map((comment) => (
          <div key={comment._id} className="comment-item">
            <p>Content: {comment.content}</p>
            <p>UserID: {comment.userId}</p>
            <p>Created At: {comment.createdAt}</p>
            <p>Upvotes: {comment.upvotes}</p>
            {isEditing && editCommentId === comment._id ? (
              <div>
                <input
                  type="text"
                  value={editCommentContent}
                  onChange={(e) => setEditCommentContent(e.target.value)}
                />
                <button
                  onClick={() => {
                    handleCommentEdit(comment._id, editCommentContent);
                    setIsEditing(false);
                    setEditCommentContent("");
                    setEditCommentId(null);
                  }}
                >
                  Save
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEditCommentContent(comment.content);
                    setEditCommentId(comment._id);
                  }}
                >
                  Edit
                </button>
                <button onClick={() => handleCommentDelete(comment._id)}>
                  Delete
                </button>
              </>
            )}

            {/* Render Replies */}
            <div className="replies">
              {comment.replies &&
                comment.replies.map((reply) => (
                  <div key={reply._id} className="reply-item">
                    <p>Content: {reply.content}</p>
                    <p>UserID: {reply.userId}</p>
                    <p>Created At: {reply.createdAt}</p>

                    {/* Render Nested Replies */}
                    {reply.replies &&
                      reply.replies.map((nestedReply) => (
                        <div
                          key={nestedReply._id}
                          className="nested-reply-item"
                        >
                          <p>Content: {nestedReply.content}</p>
                          <p>UserID: {nestedReply.userId}</p>
                          <p>Created At: {nestedReply.createdAt}</p>
                        </div>
                      ))}
                  </div>
                ))}
            </div>
            {/* Reply Form */}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleReply(comment._id);
                setReplyContent("");
              }}
            >
              <label>
                Reply:
                <textarea
                  name="replyContent"
                  value={replyContent}
                  onChange={(event) => setReplyContent(event.target.value)}
                />
              </label>
              <button type="submit">Submit Reply</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CommentSection;
