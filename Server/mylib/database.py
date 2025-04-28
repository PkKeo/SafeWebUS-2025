import mysql.connector

DB_HOST = "mysql-safeweb-us-2025-minhcvn2011-safeweb-us-2025.j.aivencloud.com"
DB_USER = "avnadmin"
DB_PASSWORD = "AVNS_yZU_X1R8rdXO48dPrQ5"
DATABASE = "safeWebSchema"
DB_PORT = 19601

def connectToMySQL():
    conn = mysql.connector.connect(
    host= DB_HOST,
    user= DB_USER,
    password= DB_PASSWORD,
    database= DATABASE,
    port=DB_PORT,
    ssl_disabled=False  # use SSL
)
    return conn


def registerToDB(user_data):
    try:
        if(user_data.gmail == ""): 
            return {"error" : "User gmail is empty"}
        if(user_data.id == ""): 
            return {"error" : "User Id is empty"}
        conn = connectToMySQL()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO User (Gmail, Id) VALUES (%s, %s)", (user_data.gmail, user_data.id))
        conn.commit()
        
        cursor.close()
        conn.close()
        return {"status" : "Adding user sucessfully"}
    except Exception as e:
        return {"error": str(e)}


def getCountByWeb(request):
    try:
        conn = connectToMySQL()
        cursor = conn.cursor(dictionary=True)
        
        query = """
            SELECT WebUrl, COUNT(*) AS AbortCount
            FROM Abort
            WHERE Id = %s
            GROUP BY WebUrl
            LIMIT 5
        """
        cursor.execute(query, (request.id,))
        rows = cursor.fetchall()
        return rows
    except Exception as e:
        return {"error": str(e)}

    finally:
        cursor.close()
        conn.close()


def getCountByTag(request):
    try:
        conn = connectToMySQL()
        cursor = conn.cursor(dictionary=True)
        
        query = """
            SELECT Reason, COUNT(*) AS AbortCount
            FROM Abort
            WHERE Id = %s
            GROUP BY Reason
            LIMIT 5
        """
        cursor.execute(query, (request.id,))
        rows = cursor.fetchall()
        return rows
    except Exception as e:
        return {"error": str(e)}

    finally:
        cursor.close()
        conn.close()
  
def getCountByHour(request):   
    # 1. Connect to DB
    conn = connectToMySQL()
    cursor = conn.cursor(dictionary=True)  # so we get dict rows

    try:
        # 2. Query abort counts grouped by hour (0–23)
        query = """
            SELECT 
            HOUR(TimeAbort) AS hour, 
            COUNT(*) AS abort_count
            FROM Abort
            WHERE Id = %s
            AND TimeAbort >= NOW() - INTERVAL 24 HOUR
            GROUP BY hour
            ORDER BY hour
        """
        cursor.execute(query, (request.id,))
        rows = cursor.fetchall()

        # 3. Convert to { "0": 5, "1": 0, ... }
        result = { str(row["hour"]): row["abort_count"] for row in rows }

        # 4. Ensure all 24 hours are present (fill missing with 0)
        for h in range(24):
            result.setdefault(str(h), 0)

        return result

    except Exception as e:
        return {"error": str(e)}

    finally:
        cursor.close()
        conn.close() 
