import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/database/mongoose";
import { Notification } from "@/database/models/notification.model";
import { getAuth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase();

    // Get current user
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const isRead = searchParams.get("isRead");
    const limit = parseInt(searchParams.get("limit") || "10");
    const since = searchParams.get("since"); // ISO timestamp to get notifications after this time

    // Build query
    const query: any = { userId };
    if (isRead !== null) {
      query.isRead = isRead === "true";
    }
    if (since) {
      query.createdAt = { $gt: new Date(since) };
    }

    // Fetch notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Get count of unread notifications
    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase();

    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { notificationId, markAllAsRead } = await request.json();

    if (markAllAsRead) {
      // Mark all notifications as read for this user
      await Notification.updateMany(
        { userId, isRead: false },
        { $set: { isRead: true } }
      );
      return NextResponse.json({ success: true });
    }

    if (notificationId) {
      // Mark specific notification as read
      await Notification.updateOne(
        { _id: notificationId, userId },
        { $set: { isRead: true } }
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Missing notificationId or markAllAsRead" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}
