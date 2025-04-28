import torch
from sklearn.metrics.pairwise import cosine_similarity
from . import database
import datetime




def get_best_tag_per_image(model, tokenizer, imageList, tags, device, webUrl, id, imageUrl):
    try:
        # Encode text once for all images
        tag_descriptions = [f"An image containing {tag}" for tag in tags]
        text_tokens = tokenizer(tag_descriptions).to(device)

        with torch.no_grad():
            text_features = model.encode_text(text_tokens)
            text_features /= text_features.norm(dim=-1, keepdim=True)

        results = []

        for idx, image_input in enumerate(imageList):
            # Encode single image
            with torch.no_grad():
                image_features = model.encode_image(image_input)
                image_features /= image_features.norm(dim=-1, keepdim=True)

            # Compute cosine similarity
            similarity_scores = cosine_similarity(
                image_features.cpu().numpy(),
                text_features.cpu().numpy()
            )[0]

            best_index = similarity_scores.argmax()
            best_tag = tags[best_index]
            best_score = similarity_scores[best_index]

            # Update to database
            #Connect to MySQL
            conn = database.connectToMySQL()
            cursor = conn.cursor()

            # Querry to update
            now = datetime.datetime.now()
            formatted = now.strftime('%Y-%m-%d %H:%M:%S')

            cursor.execute("INSERT INTO Abort (Id, WebUrl, ImageUrl, Reason, TimeAbort) VALUES (%s, %s, %s, %s, %s)", 
                           (id, webUrl, imageUrl, best_tag, formatted))
            conn.commit()
           
            cursor.close()
            conn.close()

            print(f"[Image {idx}] Best Match: {best_tag} ({best_score:.3f})")

            results.append({
                "image_index": idx,
                "best_tag": best_tag,
                "score": float(best_score),
                "all_scores": dict(zip(tags, similarity_scores.tolist()))
            })

        return results

    except Exception as e:
        return {"error": str(e)}
    




